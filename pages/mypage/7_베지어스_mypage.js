// ===== 전역 변수 =====
let userData = null;
let badgesData = null;
let veganTypesData = null;
let isEditMode = false;
let nameTag = null;
let veganTypeTag = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('페이지 로드 시작');
    try {
        await loadAllData();
        initializeProfile();
        initializeBadgeGuide(); // 여기서 에러나도 멈추지 않게
        setupEventListeners();
        console.log('초기화 완료');
    } catch (e) {
        console.error('초기화 중 치명적 오류 발생:', e);
    }
});

async function loadAllData() {
    try {
        const storedUserData = localStorage.getItem('vegetus_user_profile');
        
        if (storedUserData) {
            userData = JSON.parse(storedUserData);
        } else {
            const userResponse = await fetch('7_베지어스_mypage_user_profile.json');
            if (!userResponse.ok) throw new Error('user_profile.json 로드 실패');
            userData = await userResponse.json();
            localStorage.setItem('vegetus_user_profile', JSON.stringify(userData));
        }
        
        const badgesResponse = await fetch('7_베지어스_mypage_badges.json');
        if (!badgesResponse.ok) throw new Error('badges.json 로드 실패');
        badgesData = await badgesResponse.json();
        
        const veganTypesResponse = await fetch('7_베지어스_mypage_vegan_types.json');
        if (!veganTypesResponse.ok) throw new Error('vegan_types.json 로드 실패');
        veganTypesData = await veganTypesResponse.json();
        
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

function calculateMyBadge() {
    if (!userData || !badgesData) return null;

    const myStats = {
        recipe: userData.statistics.recipes?.successful || 0,
        community: userData.statistics.community?.successful || 0,
        scrap: userData.statistics.scraps?.successful || 0
    };

    const sortedBadges = [...badgesData.badges].sort((a, b) => b.level - a.level);

    for (const badge of sortedBadges) {
        const cond = badge.condition;
        if (!cond) continue;

        if (
            myStats.recipe >= cond.recipe &&
            myStats.community >= cond.community &&
            myStats.scrap >= cond.scrap
        ) {
            return badge;
        }
    }

    return badgesData.badges.find(b => b.level === 1);
}

function initializeProfile() {
    if (!userData) return;

    // 프로필 요소가 있는 경우에만 실행
    nameTag = document.getElementById('profileName');
    veganTypeTag = document.getElementById('profileType');
    
    if (nameTag) nameTag.textContent = userData.profile.name;
    if (veganTypeTag) veganTypeTag.textContent = userData.profile.veganType;

    const currentBadge = calculateMyBadge();
    
    if (currentBadge) {
        userData.profile.badge = currentBadge;

        const badgeTag = document.getElementById('profileBadge');
        if (badgeTag) {
            badgeTag.innerHTML = `
                ${currentBadge.name}
                <img src="${currentBadge.icon}" alt="${currentBadge.name}" />
            `;
        }
    }

    const avatar = document.getElementById('profileAvatar');
    if (avatar) {
        avatar.src = userData.profile.avatar;
    }

    updateStatistics();
}

function updateStatistics() {
    if (!userData || !badgesData) return;

    const statsContainer = document.getElementById('statsContainer');
    
    // ✨ 핵심 수정: statsContainer가 없으면(나의 레시피 페이지 등) 함수 종료 ✨
    if (!statsContainer) {
        return; 
    }

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
                        <div class="mypage_stat_caption">Unsuccessful</div>
                    </div>
                    <div class="mypage_stat_item">
                        <div class="mypage_stat_row">
                            <span class="mypage_stat_indicator ${config.successClass}"></span>
                            <span class="mypage_stat_number">${successCount}</span>
                        </div>
                        <div class="mypage_stat_caption">Successful</div>
                    </div>
                </div>
            </div>
        `;
        statsContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function initializeBadgeGuide() {
    if (!badgesData) return;

    const badgeList = document.querySelector('.mypage_badge_list');
    
    // ✨ 핵심 수정: 뱃지 리스트 컨테이너가 없으면 종료 ✨
    if (!badgeList) { 
        return; 
    }
    
    badgeList.innerHTML = '';
    
    badgesData.badges.forEach((badge) => {
        const badgeItem = document.createElement('div');
        badgeItem.className = 'mypage_badge_item';
        badgeItem.innerHTML = `
            <div class="mypage_badge_icon_box">
                <img src="${badge.icon}" alt="${badge.name}">
            </div>
            <div class="mypage_badge_info">
                <h3 class="mypage_badge_name">${badge.name} ${badge.emoji}</h3>
                <p class="mypage_badge_description">${badge.description}</p>
                <div class="mypage_badge_requirement">
                    <span class="mypage_requirement_label">달성 조건</span>
                    <span class="mypage_requirement_text">${badge.requirement}</span>
                </div>
            </div>
        `;
        badgeList.appendChild(badgeItem);
    });
}

function setupEventListeners() {
    // 안전한 버튼 선택을 위해 for loop 사용 혹은 존재 여부 체크
    const btns = document.querySelectorAll('.mypage_btn');
    
    if (btns.length > 0) {
        // 첫 번째 버튼 (Edit)
        btns[0].addEventListener('click', toggleEditMode);
    }
    if (btns.length > 1) {
        // 두 번째 버튼 (Badge Guide)
        btns[1].addEventListener('click', () => {
            const modal = document.getElementById('mypage_badgeGuideModal');
            if (modal) modal.classList.add('active');
        });
    }

    const closeModalBtn = document.querySelector('.mypage_badge_modal_close');
    const modalOverlay = document.querySelector('.mypage_badge_modal_overlay');
    const badgeModal = document.getElementById('mypage_badgeGuideModal');
    
    if (closeModalBtn && badgeModal) {
        closeModalBtn.addEventListener('click', () => {
            badgeModal.classList.remove('active');
        });
    }
    
    if (modalOverlay && badgeModal) {
        modalOverlay.addEventListener('click', () => {
            badgeModal.classList.remove('active');
        });
    }

    const avatar = document.getElementById('profileAvatar');
    const fileInput = document.getElementById('profileImageInput');

    if (avatar && fileInput) {
        avatar.addEventListener('click', () => {
            if (isEditMode) {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    avatar.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    document.addEventListener('keydown', handleKeyPress);
}

function toggleEditMode() {
    const editBtn = document.querySelectorAll('.mypage_btn')[0];
    if (!editBtn) return;

    if (!isEditMode) {
        enterEditMode(editBtn);
    } else {
        exitEditMode(editBtn);
    }
}

function enterEditMode(editBtn) {
    if (!userData || !veganTypesData) {
        alert('데이터를 불러오는 중입니다.');
        return;
    }

    isEditMode = true;
    editBtn.textContent = 'Complete';
    
    const avatar = document.getElementById('profileAvatar');
    if (avatar) {
        avatar.classList.add('mypage_avatar_edit_mode');
    }

    const currentNameTag = document.getElementById('profileName') || nameTag;
    const currentVeganTag = document.getElementById('profileType') || veganTypeTag;
    
    // 요소가 없을 경우 대비
    if (!currentNameTag || !currentVeganTag) return;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = userData.profile.name;
    nameInput.className = 'mypage_tag mypage_edit_input';
    currentNameTag.replaceWith(nameInput);
    
    const veganSelect = document.createElement('select');
    veganSelect.className = 'mypage_tag mypage_edit_select';
    
    veganTypesData.veganTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.name;
        option.textContent = type.name;
        if (type.name === userData.profile.veganType) {
            option.selected = true;
        }
        veganSelect.appendChild(option);
    });
    
    currentVeganTag.replaceWith(veganSelect);
}

function exitEditMode(editBtn) {
    isEditMode = false;
    editBtn.textContent = 'Edit';

    const avatar = document.getElementById('profileAvatar');
    if (avatar) {
        avatar.classList.remove('mypage_avatar_edit_mode');
    }
    
    const nameInput = document.querySelector('.mypage_edit_input');
    const veganSelect = document.querySelector('.mypage_edit_select');
    
    if (!nameInput || !veganSelect) return;
    
    const newName = nameInput.value.trim() || userData.profile.name;
    const newVeganType = veganSelect.value;
    const newAvatar = avatar ? avatar.src : userData.profile.avatar;
    
    userData.profile.name = newName;
    userData.profile.veganType = newVeganType;
    userData.profile.avatar = newAvatar;
    
    localStorage.setItem('vegetus_user_profile', JSON.stringify(userData));
    
    const newNameTag = document.createElement('span');
    newNameTag.className = 'mypage_tag';
    newNameTag.id = 'profileName';
    newNameTag.textContent = newName;
    nameInput.replaceWith(newNameTag);
    
    const newVeganTypeTag = document.createElement('span');
    newVeganTypeTag.className = 'mypage_tag';
    newVeganTypeTag.id = 'profileType';
    newVeganTypeTag.textContent = newVeganType;
    veganSelect.replaceWith(newVeganTypeTag);
    
    nameTag = newNameTag;
    veganTypeTag = newVeganTypeTag;
}

function handleKeyPress(e) {
    const badgeModal = document.getElementById('mypage_badgeGuideModal');
    if (e.key === 'Escape' && badgeModal && badgeModal.classList.contains('active')) {
        badgeModal.classList.remove('active');
        return;
    }
    
    if (isEditMode) {
        if (e.key === 'Enter') {
            const editBtn = document.querySelectorAll('.mypage_btn')[0];
            if (editBtn) exitEditMode(editBtn);
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    }
}

function cancelEdit() {
    isEditMode = false;
    const editBtn = document.querySelectorAll('.mypage_btn')[0];
    if (editBtn) editBtn.textContent = 'Edit';

    const avatar = document.getElementById('profileAvatar');
    if (avatar) {
        avatar.classList.remove('mypage_avatar_edit_mode');
        avatar.src = userData.profile.avatar;
    }
    
    const nameInput = document.querySelector('.mypage_edit_input');
    const veganSelect = document.querySelector('.mypage_edit_select');
    
    if (!nameInput || !veganSelect) return;
    
    const newNameTag = document.createElement('span');
    newNameTag.className = 'mypage_tag';
    newNameTag.id = 'profileName';
    newNameTag.textContent = userData.profile.name;
    nameInput.replaceWith(newNameTag);
    
    const newVeganTypeTag = document.createElement('span');
    newVeganTypeTag.className = 'mypage_tag';
    newVeganTypeTag.id = 'profileType';
    newVeganTypeTag.textContent = userData.profile.veganType;
    veganSelect.replaceWith(newVeganTypeTag);
    
    nameTag = newNameTag;
    veganTypeTag = newVeganTypeTag;
}