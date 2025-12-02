/**
 * [파일명: 7_베지어스_mypage.js]
 * 마이페이지 메인 로직
 * 역할: 데이터 로드, 프로필 표시/수정, 배지 모달 제어, 차트 렌더링 함수 호출
 */

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
        initializeProfile();    // 프로필 초기화 (+ 차트 그리기 호출)
        initializeBadgeGuide(); // 뱃지 가이드 모달 초기화
        setupEventListeners();  // 버튼 이벤트 연결
        console.log('초기화 완료');
    } catch (e) {
        console.error('초기화 중 치명적 오류 발생:', e);
    }
});

async function loadAllData() {
    try {
        // 1. 유저 데이터 로드 (로컬스토리지 우선)
        const storedUserData = localStorage.getItem('vegetus_user_profile');
        if (storedUserData) {
            userData = JSON.parse(storedUserData);
        } else {
            const userResponse = await fetch('7_베지어스_mypage_user_profile.json');
            if (!userResponse.ok) throw new Error('user_profile.json 로드 실패');
            userData = await userResponse.json();
            localStorage.setItem('vegetus_user_profile', JSON.stringify(userData));
        }
        
        // 2. 뱃지 데이터 로드
        const badgesResponse = await fetch('7_베지어스_mypage_badges.json');
        if (!badgesResponse.ok) throw new Error('badges.json 로드 실패');
        badgesData = await badgesResponse.json();
        
        // 3. 비건 타입 데이터 로드
        const veganTypesResponse = await fetch('7_베지어스_mypage_vegan_types.json');
        if (!veganTypesResponse.ok) throw new Error('vegan_types.json 로드 실패');
        veganTypesData = await veganTypesResponse.json();
        
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

// 현재 내 활동량에 맞는 뱃지 계산
function calculateMyBadge() {
    if (!userData || !badgesData) return null;

    const myStats = {
        recipe: userData.statistics.recipes?.successful || 0,
        community: userData.statistics.community?.successful || 0,
        scrap: userData.statistics.scraps?.successful || 0
    };

    // 레벨 높은 순으로 정렬 후 조건 체크
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
    // 조건 맞는게 없으면 레벨 1 리턴
    return badgesData.badges.find(b => b.level === 1);
}

function initializeProfile() {
    if (!userData) return;

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

    // ★ 차트 파일(7_베지어스_mypage_charts.js)에 있는 함수 호출
    if (typeof renderMyPageCharts === 'function') {
        renderMyPageCharts(userData, badgesData);
    } else {
        console.warn('차트 스크립트(charts.js)가 로드되지 않아 차트를 그릴 수 없습니다.');
    }
}

function initializeBadgeGuide() {
    if (!badgesData) return;
    const badgeList = document.querySelector('.mypage_badge_list');
    if (!badgeList) return;
    
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
    // 1. 프로필 수정/가이드 버튼
    const btns = document.querySelectorAll('.mypage_btn');
    if (btns.length > 0) btns[0].addEventListener('click', toggleEditMode);
    if (btns.length > 1) {
        btns[1].addEventListener('click', () => {
            const modal = document.getElementById('mypage_badgeGuideModal');
            if (modal) modal.classList.add('active');
        });
    }

    // 2. 모달 닫기
    const closeModalBtn = document.querySelector('.mypage_badge_modal_close');
    const modalOverlay = document.querySelector('.mypage_badge_modal_overlay');
    const badgeModal = document.getElementById('mypage_badgeGuideModal');
    
    if (closeModalBtn && badgeModal) {
        closeModalBtn.addEventListener('click', () => badgeModal.classList.remove('active'));
    }
    if (modalOverlay && badgeModal) {
        modalOverlay.addEventListener('click', () => badgeModal.classList.remove('active'));
    }

    // 3. 이미지 업로드
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
    
    // 4. 키보드 이벤트 (ESC, Enter)
    document.addEventListener('keydown', handleKeyPress);
}

// ===== Edit Mode Functions (수정 모드 관련) =====
function toggleEditMode() {
    const editBtn = document.querySelectorAll('.mypage_btn')[0];
    if (!editBtn) return;
    if (!isEditMode) enterEditMode(editBtn);
    else exitEditMode(editBtn);
}

function enterEditMode(editBtn) {
    if (!userData || !veganTypesData) {
        alert('데이터를 불러오는 중입니다.');
        return;
    }
    isEditMode = true;
    editBtn.textContent = 'Complete';
    
    const avatar = document.getElementById('profileAvatar');
    if (avatar) avatar.classList.add('mypage_avatar_edit_mode');

    const currentNameTag = document.getElementById('profileName') || nameTag;
    const currentVeganTag = document.getElementById('profileType') || veganTypeTag;
    if (!currentNameTag || !currentVeganTag) return;

    // 이름 -> input 변환
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = userData.profile.name;
    nameInput.className = 'mypage_tag mypage_edit_input';
    currentNameTag.replaceWith(nameInput);
    
    // 비건 타입 -> select 변환
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
    
    // 값 저장
    const newName = nameInput.value.trim() || userData.profile.name;
    const newVeganType = veganSelect.value;
    const newAvatar = avatar ? avatar.src : userData.profile.avatar;
    
    userData.profile.name = newName;
    userData.profile.veganType = newVeganType;
    userData.profile.avatar = newAvatar;
    
    localStorage.setItem('vegetus_user_profile', JSON.stringify(userData));
    
    // UI 원복
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
    // 모달 닫기
    if (e.key === 'Escape' && badgeModal && badgeModal.classList.contains('active')) {
        badgeModal.classList.remove('active');
        return;
    }
    // 수정 모드 제어
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
    
    // 원래 값으로 복구
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