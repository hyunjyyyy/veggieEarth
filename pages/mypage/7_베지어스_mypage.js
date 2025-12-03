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
        await loadAllData();     // 1. 모든 데이터 로드 및 통계 최신화
        initializeProfile();     // 2. 프로필 UI 및 뱃지 업데이트
        initializeBadgeGuide();  // 3. 뱃지 가이드 모달 생성
        setupEventListeners();   // 4. 이벤트 연결
        console.log('✅ 초기화 완료');
    } catch (e) {
        console.error('❌ 초기화 중 치명적 오류 발생:', e);
    }
});

// 1. 데이터 로드 및 통계 업데이트 통합 함수
async function loadAllData() {
    try {
        // (1) 유저 프로필 로드
        const storedUserData = localStorage.getItem('vegetus_user_profile');
        if (storedUserData) {
            userData = JSON.parse(storedUserData);
        } else {
            const userResponse = await fetch('7_베지어스_mypage_user_profile.json');
            userData = await userResponse.json();
        }

        // (2) 뱃지 & 비건 타입 JSON 로드 (병렬 처리)
        const [badgesRes, veganTypesRes] = await Promise.all([
            fetch('7_베지어스_mypage_badges.json'),
            fetch('7_베지어스_mypage_vegan_types.json')
        ]);
        
        badgesData = await badgesRes.json();
        veganTypesData = await veganTypesRes.json();

        // (3) ★ 실제 활동 데이터(커뮤니티, 레시피) 카운팅 후 userData 업데이트
        await updateRealTimeStats();

    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

// ★★★ 실제 데이터 파일들을 읽어서 통계 숫자를 계산하고 userData에 반영 ★★★
async function updateRealTimeStats() {
    if (!userData) return;

    try {
        // ========== 1. 커뮤니티 게시글 수 계산 ==========
        let allPosts = [];
        const localPosts = localStorage.getItem("community_posts");
        if (localPosts) {
            allPosts = JSON.parse(localPosts);
        } else {
            const res = await fetch('community_posts.json');
            const data = await res.json();
            allPosts = data.posts || [];
        }
        const myPostCount = allPosts.filter(post => post.id === CURRENT_USER_ID).length;
        
        // ========== 2. 레시피 작성 수 계산 ==========
        let myRecipeCount = 0;
        try {
            const recipeRes = await fetch('7_베지어스_recipe.json');
            const recipeData = await recipeRes.json();
            const allRecipes = recipeData.recipes || [];
            
            myRecipeCount = allRecipes.filter(recipe => 
                recipe.author === CURRENT_USER_ID || recipe.id === CURRENT_USER_ID
            ).length;
        } catch (e) {
            console.warn('레시피 파일 로드 실패 (0으로 처리)', e);
        }

        // ========== 3. 스크랩 수 계산 (기존 방식 유지 - 추후 수정) ==========
        let myScrapCount = 0;
        const localScraps = localStorage.getItem("vegetus_scraps");
        if (localScraps) {
            myScrapCount = JSON.parse(localScraps).length;
        } else if (userData.statistics.scraps?.list) {
            myScrapCount = userData.statistics.scraps.list.length;
        } else {
            myScrapCount = userData.statistics.scraps?.successful || 0;
        }

        // ========== 4. UserData 객체에 최신 통계 반영 ==========
        if (!userData.statistics.community) userData.statistics.community = {};
        if (!userData.statistics.recipes) userData.statistics.recipes = {};
        if (!userData.statistics.scraps) userData.statistics.scraps = {};

        userData.statistics.community.successful = myPostCount;
        userData.statistics.recipes.successful = myRecipeCount;
        userData.statistics.scraps.successful = myScrapCount;

        // 로컬스토리지에 저장 (다음 방문 시 유지)
        localStorage.setItem('vegetus_user_profile', JSON.stringify(userData));

        console.log(`📊 [실시간 통계] 게시글: ${myPostCount}, 레시피: ${myRecipeCount}, 스크랩: ${myScrapCount}`);

    } catch (e) {
        console.error('통계 업데이트 중 오류:', e);
    }
}

// ★ 핵심 로직: badges.json의 기준과 내 통계를 비교하여 뱃지 결정
function calculateMyBadge() {
    if (!userData || !badgesData) return null;

    // 내 현재 스탯
    const myStats = {
        recipe: userData.statistics.recipes.successful || 0,
        community: userData.statistics.community.successful || 0,
        scrap: userData.statistics.scraps.successful || 0
    };

    // 레벨이 높은 순서대로 정렬 (4 -> 3 -> 2 -> 1)
    const sortedBadges = [...badgesData.badges].sort((a, b) => b.level - a.level);

    for (const badge of sortedBadges) {
        const cond = badge.condition;
        if (!cond) continue; 

        const isRecipeMet = myStats.recipe >= cond.recipe;
        const isCommunityMet = myStats.community >= cond.community;
        const isScrapMet = myStats.scrap >= cond.scrap;

        if (isRecipeMet && isCommunityMet && isScrapMet) {
            console.log(`🎉 뱃지 획득! [${badge.name}] 조건을 만족했습니다.`);
            return badge;
        }
    }

    console.log('🌱 만족하는 상위 뱃지가 없어 [새싹 비건] 유지');
    return badgesData.badges.find(b => b.level === 1);
}

function initializeProfile() {
    if (!userData) return;

    nameTag = document.getElementById('profileName');
    veganTypeTag = document.getElementById('profileType');
    
    if (nameTag) nameTag.textContent = userData.profile.name;
    if (veganTypeTag) veganTypeTag.textContent = userData.profile.veganType;

    // 뱃지 계산 및 표시
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

    // 차트 렌더링
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

// ===== 수정 모드 관련 함수들 =====
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