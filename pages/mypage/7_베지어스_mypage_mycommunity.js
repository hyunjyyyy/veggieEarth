/**
 * [파일명: mypage_mycommunity.js]
 * 마이페이지 - 커뮤니티 활동 관리 스크립트
 * 역할: 내 게시글 로드, 탭 필터링, 게시글 렌더링
 */

document.addEventListener('DOMContentLoaded', () => {
    const currentUserId = "user01"; // 현재 로그인한 유저 ID
    const jsonPath = '../community/community_posts.json'; 

    // 2. DOM 요소
    const postListContainer = document.querySelector('.community_post_list');
    const filterButtons = document.querySelectorAll('.mypage_mycommunity_filter_btn');
    let myPosts = [];

    // 4. 시간 포맷팅 함수 (community.js와 동일)
    function formatTimeLabel(iso) {
        if (!iso) return "";
        const diff = Date.now() - new Date(iso).getTime();
        const min = Math.floor(diff / 60000);
        if (min < 1) return "방금 전";
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        return `${Math.floor(hr / 24)}d ago`;
    }

    // 5. 초기 데이터 로드
    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            // 전체 글 중 내 글만 필터링
            myPosts = data.posts.filter(post => post.id === currentUserId);
            
            // 초기 렌더링 (전체 탭 기준)
            renderMyPosts(myPosts);
        })
        .catch(error => {
            console.error('게시글 로드 실패:', error);
            postListContainer.innerHTML = '<p style="text-align:center; padding: 20px;">게시글을 불러오는 데 실패했습니다.</p>';
        });

    // 6. 탭(필터) 버튼 클릭 이벤트
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const boardType = e.target.getAttribute('data-board');
            filterPosts(boardType);
        });
    });

    function filterPosts(boardType) {
        let filteredData = [];

        if (boardType === 'all') {
            filteredData = myPosts;
        } else {
            const categoryMap = {
                'free': 'free',
                'question': 'qna',
                'review': 'review'
            };
            const targetCategory = categoryMap[boardType];
            filteredData = myPosts.filter(post => post.category === targetCategory);
        }

        renderMyPosts(filteredData);
    }

    // 8. 렌더링 함수 (community.js의 HTML 구조 동일시)
    function renderMyPosts(posts) {
        postListContainer.innerHTML = ''; 

        if (posts.length === 0) {
            postListContainer.innerHTML = '<p class="no-posts-msg" style="text-align:center; padding:50px; color:#888;">작성한 게시글이 없습니다.</p>';
            return;
        }

        posts.forEach(post => {
            const img = post.imageData || post.image || "";

            const item = document.createElement("div");
            item.className = "community_post_item community_post_box";
            item.dataset.id = post.id;

            item.innerHTML = `
                <div class="community_post_main_wrapper">
                    <div class="community_post_text_wrap">
                        <div class="community_post_header">
                            <img src="${post.authorImage}" class="community_user_profile_img">
                            <span class="community_user_name">${post.authorName}</span>
                            <img src="${post.badgeImage}" class="community_user_badge_img">
                        </div>

                        <div class="community_post_content">
                            <p class="community_post_title">${post.title}</p>
                            <p class="community_post_text">${post.text}</p>
                        </div>

                        <div class="community_post_meta">
                            <span class="community_post_time">${formatTimeLabel(post.createdAt)}</span>
                            <span class="community_post_likes">
                                ${post.likes}
                                <img src="../../assets/images/Heart.png">
                            </span>
                        </div>
                    </div>

                    <div class="community_post_image_box" style="${img ? "" : "background:transparent; display:none;"}">
                        ${img ? `<img src="${img}">` : ""}
                    </div>
                </div>
            `;
            postListContainer.appendChild(item);
        });
    }
});