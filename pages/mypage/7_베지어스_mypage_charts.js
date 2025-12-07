function renderMyPageCharts(userData, badgesData) {
    const statsContainer = document.getElementById('statsContainer');
    
    if (!statsContainer || !userData || !badgesData) return;

    const statsData = userData.statistics;
    const currentLevel = userData.profile.badge ? userData.profile.badge.level : 1;
    const nextBadge = badgesData.badges.find(b => b.level === currentLevel + 1);
    
    const statConfig = [
        { key: 'recipes', jsonKey: 'recipe', title: '레시피 업로드 수', color: '#2b463c', successClass: 'mypage_indicator_success_1' },
        { key: 'community', jsonKey: 'community', title: '게시글 업로드 수', color: '#688f4e', successClass: 'mypage_indicator_success_2' },
        { key: 'scraps', jsonKey: 'scrap', title: '스크랩 수', color: '#b1d182', successClass: 'mypage_indicator_success_3' }
    ];

    statsContainer.innerHTML = '';

    statConfig.forEach(config => {
        const data = statsData[config.key]; 
        const successCount = data ? (data.successful || 0) : 0;
        const failCount = data ? (data.unsuccessful || 0) : 0;
        
        let percentage = 0;
        let targetCount = 0;

        if (!nextBadge) {
            percentage = 100;
            targetCount = successCount;
        } else {
            targetCount = nextBadge.condition[config.jsonKey];
            if (targetCount > 0) {
                percentage = Math.round((successCount / targetCount) * 100);
                if (percentage > 100) percentage = 100;
            }
        }

        const cardHTML = `
            <div class="mypage_stat_card">
                <h3 class="mypage_stat_title">${config.title}</h3>
                <div class="mypage_chart_container">
                    <div class="mypage_donut_chart" style="background: conic-gradient(${config.color} 0% ${percentage}%, #f4f1e9 ${percentage}% 100%);">
                        <span class="mypage_chart_percentage">${percentage}%</span>
                    </div>
                </div>
                <div class="mypage_stat_details">
                    <div class="mypage_stat_item">
                        <div class="mypage_stat_row">
                            <span class="mypage_stat_indicator mypage_indicator_unsuccessful"></span>
                            <span class="mypage_stat_number">${failCount}</span>
                        </div>
                        <div class="mypage_stat_caption">남은 개수</div>
                    </div>
                    <div class="mypage_stat_item">
                        <div class="mypage_stat_row">
                            <span class="mypage_stat_indicator ${config.successClass}"></span>
                            <span class="mypage_stat_number">${successCount}</span>
                        </div>
                        <div class="mypage_stat_caption">현재 달성 수</div>
                    </div>
                </div>
            </div>
        `;
        statsContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}