/**
 * [파일명: 7_베지어스_mypage.js]
 * 마이페이지 메인 로직
 * 역할: 데이터 로드(커뮤니티/레시피 연동), 통계 자동 계산, 뱃지 JSON 기준 비교, 프로필 렌더링
 */

// ===== 전역 변수 =====
let userData = null;
let badgesData = null;
let veganTypesData = null;
let isEditMode = false;
let nameTag = null;
let veganTypeTag = null;

const CURRENT_USER_ID = "user01"; // 현재 로그인한 사용자 ID

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔹 페이지 로드 및 초기화 시작');
    try {
        await loadAllData();    
        initializeProfile();     
        initializeBadgeGuide();  
        setupEventListeners();   
        console.log('초기화 완료');
    } catch (e) {
        console.error('초기화 중 오류 발생:', e);
    }
});


async function loadAllData() {
    try {

        const userResponse = await fetch('7_베지어스_mypage_user_profile.json');
        const defaultUserData = await userResponse.json();
        
        const storedUserData = localStorage.getItem('vegetus_user_profile');
        if (storedUserData) {
            userData = JSON.parse(storedUserData);

            if(!userData.statistics) userData.statistics = defaultUserData.statistics;
        } else {
            userData = defaultUserData;
        }

        const [badgesRes, veganTypesRes] = await Promise.all([
            fetch('7_베지어스_mypage_badges.json'),
            fetch('7_베지어스_mypage_vegan_types.json')
        ]);
        
        badgesData = await badgesRes.json();
        veganTypesData = await veganTypesRes.json();


        await updateRealTimeStats();

    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

async function updateRealTimeStats() {
    if (!userData || !badgesData) return;

    try {
        let myPostCount = 0;
        try {
            const communityRes = await fetch('../community/community_posts.json');
            const communityData = await communityRes.json();
            myPostCount = (communityData.posts || []).filter(p => p.id === CURRENT_USER_ID).length;
        } catch (e) { console.warn('커뮤니티 로드 실패', e); }

        // (2) 레시피 & 스크랩
        let myRecipeCount = 0;
        let myScrapCount = 0;
        try {
            const recipeRes = await fetch('../recipe/recipes.json');
            const recipeData = await recipeRes.json();
            const allRecipes = recipeData.recipes || [];
            
            myRecipeCount = allRecipes.filter(r => r.id === CURRENT_USER_ID || r.author === CURRENT_USER_ID).length;
            myScrapCount = allRecipes.filter(r => r.scraps && r.scraps.includes(CURRENT_USER_ID)).length;
        } catch (e) { console.warn('레시피 로드 실패', e); }


        const sortedBadges = [...badgesData.badges].sort((a, b) => a.level - b.level);
        
        let currentLevelBadge = sortedBadges[0]; 
        let nextLevelBadge = sortedBadges[1];  

        const reverseBadges = [...sortedBadges].reverse();
        for (const badge of reverseBadges) {
            const c = badge.condition;
            if (myRecipeCount >= c.recipe && myPostCount >= c.community && myScrapCount >= c.scrap) {
                currentLevelBadge = badge;
                break;
            }
        }

        const nextBadgeCandidate = sortedBadges.find(b => b.level === currentLevelBadge.level + 1);
        
        const targetCondition = nextBadgeCandidate ? nextBadgeCandidate.condition : {
            recipe: myRecipeCount,
            community: myPostCount,
            scrap: myScrapCount
        };


        function calculateStat(current, target) {
            if (target === 0) return { successful: current, unsuccessful: 0, percentage: 100 };

            if (current >= target) {
                return { successful: current, unsuccessful: 0, percentage: 100 };
            }

            const unsuccess = target - current;
            const percent = Math.floor((current / target) * 100);
            return {
                successful: current,
                unsuccessful: unsuccess,
                percentage: percent
            };
        }

        userData.statistics = {
            recipes: calculateStat(myRecipeCount, targetCondition.recipe),
            community: calculateStat(myPostCount, targetCondition.community),
            scraps: calculateStat(myScrapCount, targetCondition.scrap)
        };
        
        userData.profile.badge = currentLevelBadge;

        localStorage.setItem('vegetus_user_profile', JSON.stringify(userData));

        console.log(`[통계 갱신 완료] 현재 레벨: ${currentLevelBadge.name} (Lv.${currentLevelBadge.level})`);
        console.log(`   - 다음 목표: ${nextBadgeCandidate ? nextBadgeCandidate.name : 'MAX LEVEL'}`);
        console.log(`   - 게시글: ${userData.statistics.community.successful}/${targetCondition.community} (${userData.statistics.community.percentage}%)`);
        console.log(`   - 레시피: ${userData.statistics.recipes.successful}/${targetCondition.recipe} (${userData.statistics.recipes.percentage}%)`);
        console.log(`   - 스크랩: ${userData.statistics.scraps.successful}/${targetCondition.scrap} (${userData.statistics.scraps.percentage}%)`);

    } catch (e) {
        console.error('통계 업데이트 중 오류:', e);
    }
}

function initializeProfile() {
    if (!userData) return;

    nameTag = document.getElementById('profileName');
    veganTypeTag = document.getElementById('profileType');
    
    if (nameTag) nameTag.textContent = userData.profile.name;
    if (veganTypeTag) veganTypeTag.textContent = userData.profile.veganType;

    const currentBadge = userData.profile.badge;
    if (currentBadge) {
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

    if (typeof renderMyPageCharts === 'function') {
        renderMyPageCharts(userData, badgesData);
    }
}

function initializeBadgeGuide() {
    if (!badgesData) return;
    const badgeList = document.querySelector('.mypage_badge_list');
    if (!badgeList) return;
    
    badgeList.innerHTML = '';
    
    const sortedForDisplay = [...badgesData.badges].sort((a, b) => a.level - b.level);

    sortedForDisplay.forEach((badge) => {
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
    const btns = document.querySelectorAll('.mypage_btn');
    if (btns.length > 0) btns[0].addEventListener('click', toggleEditMode);
    if (btns.length > 1) {
        btns[1].addEventListener('click', () => {
            const modal = document.getElementById('mypage_badgeGuideModal');
            if (modal) modal.classList.add('active');
        });
    }

    const closeModalBtn = document.querySelector('.mypage_badge_modal_close');
    const modalOverlay = document.querySelector('.mypage_badge_modal_overlay');
    const badgeModal = document.getElementById('mypage_badgeGuideModal');
    
    if (closeModalBtn && badgeModal) {
        closeModalBtn.addEventListener('click', () => badgeModal.classList.remove('active'));
    }
    if (modalOverlay && badgeModal) {
        modalOverlay.addEventListener('click', () => badgeModal.classList.remove('active'));
    }

    const avatar = document.getElementById('profileAvatar');
    const fileInput = document.getElementById('profileImageInput');
    if (avatar && fileInput) {
        avatar.addEventListener('click', () => {
            if (isEditMode) fileInput.click();
        });
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => avatar.src = event.target.result;
                reader.readAsDataURL(file);
            }
        });
    }
    
    document.addEventListener('keydown', handleKeyPress);
}


function toggleEditMode() {
    const editBtn = document.querySelectorAll('.mypage_btn')[0];
    if (!editBtn) return;
    if (!isEditMode) enterEditMode(editBtn);
    else exitEditMode(editBtn);
}

function enterEditMode(editBtn) {
    if (!userData || !veganTypesData) return;
    isEditMode = true;
    editBtn.textContent = 'Complete';
    
    const avatar = document.getElementById('profileAvatar');
    if (avatar) avatar.classList.add('mypage_avatar_edit_mode');

    const currentNameTag = document.getElementById('profileName') || nameTag;
    const currentVeganTag = document.getElementById('profileType') || veganTypeTag;
    
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
        if (type.name === userData.profile.veganType) option.selected = true;
        veganSelect.appendChild(option);
    });
    currentVeganTag.replaceWith(veganSelect);
}

function exitEditMode(editBtn) {
    isEditMode = false;
    editBtn.textContent = 'Edit';

    const avatar = document.getElementById('profileAvatar');
    if (avatar) avatar.classList.remove('mypage_avatar_edit_mode');
    
    const nameInput = document.querySelector('.mypage_edit_input');
    const veganSelect = document.querySelector('.mypage_edit_select');
    if (!nameInput || !veganSelect) return;
    
    userData.profile.name = nameInput.value.trim() || userData.profile.name;
    userData.profile.veganType = veganSelect.value;
    userData.profile.avatar = avatar ? avatar.src : userData.profile.avatar;
    
    localStorage.setItem('vegetus_user_profile', JSON.stringify(userData));
    
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
    
    if (nameInput && veganSelect) {
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
}