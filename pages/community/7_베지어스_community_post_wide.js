function getAllPosts() {
    try {
        return JSON.parse(localStorage.getItem("community_posts")) || [];
    } catch {
        return [];
    }
}

function saveAllPosts(posts) {
    localStorage.setItem("community_posts", JSON.stringify(posts));
}

function getPostId() {
    return new URLSearchParams(window.location.search).get("id");
}

function getPostById(id) {
    const posts = getAllPosts();
    const post = posts.find(p => (p.postId || p.id) == id);

    if (!post) return null;

    if (!post.comments) {
        post.comments = [];
        saveAllPosts(posts);
    }

    if (post.likes === undefined) post.likes = 0;
    if (post.liked === undefined) post.liked = false;

    return post;
}

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);

    if (min < 1) return "방금 전";
    if (min < 60) return `${min}분 전`;

    const h = Math.floor(min / 60);
    if (h < 24) return `${h}시간 전`;

    return `${Math.floor(h / 24)}일 전`;
}

function renderPostDetail() {
    const postId = getPostId();
    const post = getPostById(postId);
    if (!post) return;

    document.querySelector(".post_user_profile").src = post.authorImage;
    document.querySelector(".post_user_name").textContent = post.authorName;

    if (document.querySelector(".post_user_badge"))
        document.querySelector(".post_user_badge").src = post.badgeImage;

    document.querySelector(".post_title").textContent = post.title || "(제목 없음)";
    document.querySelector(".post_text").textContent = post.text;

    const currentUser = localStorage.getItem('currentUser');
    const headerEl = document.querySelector(".post_user_header");
    
    const oldBtns = headerEl.querySelector(".post_action_buttons");
    if (oldBtns) oldBtns.remove();

    if (currentUser && (postId === currentUser || post.authorName === currentUser)) {
        const btnGroup = document.createElement("div");
        btnGroup.className = "post_action_buttons";
        
        btnGroup.innerHTML = `
            <button class="post_action_btn" title="수정" onclick="alert('수정 기능 준비중')">
                <img src="../../assets/images/7_modify.png" alt="수정">
            </button>
            <button class="post_action_btn" title="삭제" onclick="deleteCurrentPost('${postId}')">
                <img src="../../assets/images/7_delete.png" alt="삭제">
            </button>
        `;
        headerEl.appendChild(btnGroup);
    }

    const imgArea = document.querySelector(".post_image_area");
    if (post.imageData || post.image) {
        imgArea.innerHTML = `
            <img src="${post.imageData || post.image}"
                style="width:100%; height:100%; object-fit:cover;">
        `;
    } else {
        imgArea.style.display = "none";
    }

    const likeIcon = document.querySelector(".post_like_icon");
    const likeCount = document.querySelector(".post_like_count");

    likeIcon.src = post.liked
        ? "../../assets/images/7_Heart.png"
        : "../../assets/images/7_Heart_empty.png";

    likeCount.textContent = post.likes;

    likeIcon.onclick = () => {
        const posts = getAllPosts();
        const idx = posts.findIndex(p => (p.postId || p.id) == (post.postId || post.id));

        if (idx === -1) return;

        if (!posts[idx].liked) {
            posts[idx].liked = true;
            posts[idx].likes += 1;
        } else {
            posts[idx].liked = false;
            posts[idx].likes -= 1;
            if (posts[idx].likes < 0) posts[idx].likes = 0;
        }

        saveAllPosts(posts);
        renderPostDetail();
    };

    renderComments(post);
    renderHotTopics();
}

function renderHotTopics() {
    const posts = getAllPosts();
    const hotList = document.querySelector(".hot_topic_list");

    const hot = [...posts]
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 3);

    hotList.innerHTML = "";

    hot.forEach(p => {
        const item = document.createElement("div");
        item.className = "hot_topic_item";
        item.dataset.id = p.postId || p.id;

        const img = p.imageData || p.image || "../../assets/images/7_hot_topic.JPG";

        item.innerHTML = `
            <div class="hot_topic_image" 
                style="background-image:url('${img}');
                        background-size:cover;
                        background-position:center;">
            </div>

            <p class="hot_topic_text">
                <strong>${p.title}</strong><br>
                ${p.text.substring(0, 40)}
            </p>

            <div class="hot_topic_user_area">
                <img class="hot_topic_user_img" src="${p.authorImage}">
                <span class="hot_topic_user_name">${p.authorName}</span>
                <img class="hot_topic_user_badge" src="${p.badgeImage}">
            </div>
        `;

        item.addEventListener("click", () => {
            window.location.href = `7_베지어스_community_post_wide.html?id=${p.postId || p.id}`;
        });

        hotList.appendChild(item);
    });
}

function renderComments(post) {
    const list = document.querySelector(".comment_section");
    list.innerHTML = "";

    post.comments.forEach(c => {
        const el = document.createElement("div");
        el.className = "comment_item";

        el.innerHTML = `
            <div class="comment_header" style="display:flex; align-items:center; gap:8px; position:relative;">
                <img src="${c.userImg}" class="comment_profile">
                <span class="comment_username">${c.user}</span>

                <span class="comment_options_btn">⋮</span>

                <div class="comment_options_menu">
                    <button class="delete_comment" data-id="${c.id}">댓글 삭제</button>
                </div>
            </div>

            <div class="comment_text">${c.text}</div>
            <div class="comment_time">${timeAgo(c.time)}</div>
        `;

        list.appendChild(el);

        const btn = el.querySelector(".comment_options_btn");
        const menu = el.querySelector(".comment_options_menu");

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === "block" ? "none" : "block";
        });

        menu.querySelector(".delete_comment").addEventListener("click", () => {
            deleteComment(post, c.id);
        });
    });

    document.body.addEventListener("click", () => {
        document.querySelectorAll(".comment_options_menu")
            .forEach(m => m.style.display = "none");
    });
}

function addComment(post, text) {
    const currentUser = localStorage.getItem('currentUser') || "익명";
    post.comments.push({
        id: Date.now(),
        user: currentUser,
        userImg: "../../assets/images/7_Profile3.png",
        text,
        time: new Date().toISOString()
    });

    const posts = getAllPosts();
    const idx = posts.findIndex(p => (p.postId || p.id) == (post.postId || post.id));
    if (idx === -1) return;

    posts[idx] = post;

    saveAllPosts(posts);
    renderComments(post);
}

function deleteComment(post, commentId) {
    post.comments = post.comments.filter(c => c.id !== commentId);

    const posts = getAllPosts();
    const idx = posts.findIndex(p => (p.postId || p.id) == (post.postId || post.id));
    if (idx === -1) return;

    posts[idx] = post;

    saveAllPosts(posts);
    renderComments(post);
}

document.addEventListener("DOMContentLoaded", () => {
    renderPostDetail();

    const input = document.getElementById("commentInput");
    const btn = document.getElementById("btnCommentSubmit");

    if(btn && input) {
        btn.addEventListener("click", () => {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                alert("로그인 후 댓글을 작성할 수 있습니다.");
                return;
            }

            const text = input.value.trim();
            if (!text) {
                alert("댓글 내용을 입력해주세요.");
                return;
            }

            const post = getPostById(getPostId());
            if (!post) return;
            addComment(post, text); 
            input.value = "";
        });
    }
});

function deleteCurrentPost(postId) {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    let posts = getAllPosts();
    posts = posts.filter(p => (p.postId || p.id) != postId);
    saveAllPosts(posts);

    alert("게시글이 삭제되었습니다.");
    window.location.href = "7_베지어스_community.html";
}