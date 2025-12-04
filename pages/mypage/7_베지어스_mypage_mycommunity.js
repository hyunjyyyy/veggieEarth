document.addEventListener('DOMContentLoaded', () => {
    const currentUserId = "user01";
    const jsonPath = '../community/community_posts.json'; 
    const STORAGE_KEY = "community_posts";

    const postListContainer = document.querySelector('.community_post_list');
    const filterButtons = document.querySelectorAll('.mypage_mycommunity_filter_btn');
    
    let allPosts = []; 
    let myPosts = [];  

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

    function loadPosts() {
        const storedPosts = localStorage.getItem(STORAGE_KEY);
        
        if (storedPosts) {
            allPosts = JSON.parse(storedPosts);
            filterMyPosts();
        } else {
            fetch(jsonPath)
                .then(response => response.json())
                .then(data => {
                    allPosts = data.posts || [];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(allPosts));
                    filterMyPosts();
                })
                .catch(error => {
                    console.error(error);
                    postListContainer.innerHTML = '<p style="text-align:center; padding: 20px;">데이터 로드 실패</p>';
                });
        }
    }

    function filterMyPosts() {
        myPosts = allPosts.filter(post => post.id === currentUserId || post.authorName === currentUserId);
        renderMyPosts(myPosts);
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const boardType = e.target.getAttribute('data-board');
            filterCategory(boardType);
        });
    });

    postListContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.community_post_item');
        if (e.target.closest('.community_post_likes')) return; 

        if (item) {
            const postId = item.dataset.id;
            if (postId) {
                window.location.href = `../community/community_post_wide.html?id=${postId}`;
            }
        }
    });

    function filterCategory(boardType) {
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

    function renderMyPosts(posts) {
        postListContainer.innerHTML = ''; 

        if (posts.length === 0) {
            postListContainer.innerHTML = '<p class="no-posts-msg" style="text-align:center; padding:50px; color:#888;">작성한 게시글이 없습니다.</p>';
            return;
        }

        posts.forEach(post => {
            const img = post.imageData || post.image || "";
            const uniqueId = post.postId || post.id; 

            const item = document.createElement("div");
            item.className = "community_post_item community_post_box";
            item.dataset.id = uniqueId;
            item.style.cursor = "pointer";

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

    loadPosts();
});