let userData = null;
let badgesData = null;
let veganTypesData = null;
let isEditMode = false;
let nameTag = null;
let veganTypeTag = null;

const CURRENT_USER_ID = localStorage.getItem('currentUser');

if (!CURRENT_USER_ID) {
    alert("로그인이 필요합니다.");
    window.location.href = "../../pages/login/7_베지어스_login.html";
}

document.addEventListener('DOMContentLoaded', async () => {
    // console.log('페이지 로드 및 초기화 시작');
    try {
        await loadAllData();    
        initializeProfile();     
        initializeBadgeGuide();  
        setupEventListeners();   
        // console.log('초기화 완료');
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
        userData.profile.name = CURRENT_USER_ID;

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
            const storedPosts = localStorage.getItem("community_posts");
            let posts = [];

            if (storedPosts) {
                posts = JSON.parse(storedPosts);
            } else {
                const communityRes = await fetch('../community/7_베지어스_community_posts.json');
                const communityData = await communityRes.json();
                posts = communityData.posts || [];
            }
            
            myPostCount = posts.filter(p => p.id === CURRENT_USER_ID || p.authorName === CURRENT_USER_ID).length;

        } catch (e) { 
            console.warn('커뮤니티 데이터 로드 실패', e); 
        }

        let myRecipeCount = 0;
        let myScrapCount = 0;
        try {
            const storedRecipes = localStorage.getItem("allRecipes");
            let allRecipes = [];

            if (storedRecipes) {
                allRecipes = JSON.parse(storedRecipes);
            } else {
                const recipeRes = await fetch('../recipe/7_베지어스_recipes.json');
                allRecipes = await recipeRes.json(); 
            }

            if (Array.isArray(allRecipes)) {
                myRecipeCount = allRecipes.filter(r => r.author === CURRENT_USER_ID).length;
                
                const scrapData = JSON.parse(localStorage.getItem('scrappedRecipes')) || {};
                const myScraps = scrapData[CURRENT_USER_ID] || []; 
                myScrapCount = myScraps.length; 
                
            } else {
                console.warn('레시피 데이터가 배열 형식이 아닙니다.');
            }
        } catch (e) { 
            console.warn('레시피 데이터 로드 실패', e); 
        }

        const sortedBadges = [...badgesData.badges].sort((a, b) => b.level - a.level); 
        
        let newBadge = null;

        for (const badge of sortedBadges) {
            const c = badge.condition;
            if (!c) continue;

            if (myRecipeCount >= c.recipe && myPostCount >= c.community && myScrapCount >= c.scrap) {
                newBadge = badge;
                break; 
            }
        }

        if (!newBadge) {
            newBadge = sortedBadges.find(b => b.level === 1);
        }
        
        const nextBadgeCandidate = [...badgesData.badges]
            .sort((a, b) => a.level - b.level)
            .find(b => b.level === newBadge.level + 1);

        const targetCondition = nextBadgeCandidate ? nextBadgeCandidate.condition : {
            recipe: myRecipeCount,
            community: myPostCount,
            scrap: myScrapCount
        };

        function calculateStat(current, target) {
            if (target === 0) return { successful: current, unsuccessful: 0, percentage: 100 };
            const percent = Math.min(100, Math.floor((current / target) * 100));
            return {
                successful: current,
                unsuccessful: Math.max(0, target - current),
                percentage: percent
            };
        }

        userData.statistics = {
            recipes: calculateStat(myRecipeCount, targetCondition.recipe),
            community: calculateStat(myPostCount, targetCondition.community),
            scraps: calculateStat(myScrapCount, targetCondition.scrap)
        };
        
        userData.profile.badge = newBadge;

        localStorage.setItem('vegetus_user_profile', JSON.stringify(userData));

        // console.log(`[통계 업데이트 완료]`);
        // console.log(`   - 획득 뱃지: ${newBadge.name}`);
        // console.log(`   - 내 활동: 레시피(${myRecipeCount}), 게시글(${myPostCount}), 스크랩(${myScrapCount})`);

        if (typeof renderMyPageCharts === 'function') {
            renderMyPageCharts(userData, badgesData);
        }
        initializeProfile();

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
    const editBtn = document.getElementById('btnEditProfile');
    const guideBtn = document.getElementById('btnBadgeGuide');

    if (editBtn) {
        editBtn.addEventListener('click', toggleEditMode);
    }
    
    if (guideBtn) {
        guideBtn.addEventListener('click', () => {
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
    const editBtn = document.getElementById('btnEditProfile');
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
            const editBtn = document.getElementById('btnEditProfile');
            if (editBtn) exitEditMode(editBtn);
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    }
}
function cancelEdit() {
    isEditMode = false;
    const editBtn = document.getElementById('btnEditProfile');
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