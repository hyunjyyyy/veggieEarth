const DEFAULT_POSTS = [];

const TAB_CATEGORY_MAP = {
    "자유 게시판": "free",
    "질문 게시판": "qna",
    "후기 게시판": "review"
};

const STORAGE_KEYS = {
    POSTS: "community_posts",
    TAB: "community_selected_tab",
    SEARCH: "community_search_keyword"
};

document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".community_tab_button");
    const postListEl = document.querySelector(".community_post_list");
    const hotTopicListEl = document.querySelector(".community_hot_topic_list");
    const searchInput = document.querySelector(".community_search_input");
    const titleInput = document.getElementById("community_task_title");
    const descInput = document.getElementById("community_task_description");
    const createBtn = document.querySelector(".community_create_new_button");

    const uploadBox = document.querySelector(".community_upload_box");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    let selectedImageDataUrl = null;
    let allPosts = [];
    let currentTab = "free";
    let currentSearch = "";

    let incomingRestaurantId = null;

    function formatTimeLabel(iso) {
        const diff = Date.now() - new Date(iso).getTime();
        const min = Math.floor(diff / 60000);
        if (min < 1) return "방금 전";
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        return `${Math.floor(hr / 24)}d ago`;
    }

    function savePosts() {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
    }

    function saveTab() {
        localStorage.setItem(STORAGE_KEYS.TAB, currentTab);
    }

    function saveSearch() {
        localStorage.setItem(STORAGE_KEYS.SEARCH, currentSearch);
    }

    function loadStateFromStorage() {
        const p = localStorage.getItem(STORAGE_KEYS.POSTS);
        const t = localStorage.getItem(STORAGE_KEYS.TAB);
        const s = localStorage.getItem(STORAGE_KEYS.SEARCH);

        if (t) currentTab = t;
        if (s) {
            currentSearch = s;
            searchInput.value = s;
        }

        if (p) {
            try { allPosts = JSON.parse(p); }
            catch { allPosts = []; }
        }
    }

    async function loadPostsFromJson() {
        if (allPosts.length > 0) return;

        try {
            const res = await fetch("7_베지어스_community_posts.json");
            const data = await res.json();
            allPosts = data.posts;
            savePosts();
        } catch {
            allPosts = DEFAULT_POSTS;
            savePosts();
        }
    }

    let restaurantData = [];

    async function loadRestaurantData() {
        try {
            const res = await fetch("../map/7_베지어스_restaurant_data.json");
            restaurantData = await res.json();
        } catch (e) {
            restaurantData = [];
            console.error("식당 데이터 로드 실패:", e);
        }
    }

    function findRestaurantInfo(id) {
        return restaurantData.find(r => r.id === id);
    }

    function matchesSearch(post, keyword) {
        if (!keyword) return true;
        const k = keyword.toLowerCase();
        return (
            post.title.toLowerCase().includes(k) ||
            post.text.toLowerCase().includes(k) ||
            post.authorName.toLowerCase().includes(k)
        );
    }

    function updateTabButtons() {
        tabButtons.forEach(btn => {
            const cat = TAB_CATEGORY_MAP[btn.textContent.trim()];
            btn.classList.toggle("active", cat === currentTab);
        });
    }

    function renderPosts() {
        postListEl.innerHTML = "";
        const filtered = allPosts.filter(
            p => p.category === currentTab && matchesSearch(p, currentSearch)
        );

        filtered.forEach(post => {
            const img = post.imageData || post.image || "";
            const item = document.createElement("div");
            item.className = "community_post_item community_post_box";
            item.dataset.id = post.postId || post.id;

            const linkedHtml =
                post.restaurantId
                    ? (() => {
                        const r = findRestaurantInfo(post.restaurantId);
                        return r ? `<p class="linked_restaurant_name">📍 ${r.name}</p>` : "";
                    })()
                    : "";

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
                            ${linkedHtml}
                        </div>

                        <div class="community_post_meta">
                            <span class="community_post_time">${formatTimeLabel(post.createdAt)}</span>
                            <span class="community_post_likes">
                                ${post.likes}
                                <img src="../../assets/images/7_Heart.png">
                            </span>
                        </div>
                    </div>

                    <div class="community_post_image_box" style="${img ? "" : "background:transparent"}">
                        ${img ? `<img src="${img}">` : ""}
                    </div>
                </div>
            `;
            postListEl.appendChild(item);
        });
    }

    function renderHotTopics() {
        hotTopicListEl.innerHTML = "";
        const top = [...allPosts].sort((a, b) => b.likes - a.likes).slice(0, 3);

        top.forEach(p => {
            const img = p.imageData || p.image || "../../assets/images/7_hot_topic.JPG";
            const card = document.createElement("div");
            card.className = "community_hot_topic_card community_card";
            card.dataset.id = p.postId || p.id;

            card.innerHTML = `
                <div class="community_hot_topic_image_box">
                    <img src="${img}">
                </div>

                <div class="community_hot_topic_text_box">
                    <p class="community_card_title">${p.title}</p>
                    <p class="community_card_desc">${p.text}</p>

                    <div class="community_post_header">
                        <img src="${p.authorImage}" class="community_hot_user_profile_img">
                        <span class="community_hot_user_name">${p.authorName}</span>
                        <img src="${p.badgeImage}" class="community_hot_user_badge_img">
                    </div>
                </div>
            `;
            hotTopicListEl.appendChild(card);
        });
    }

    function renderAll() {
        updateTabButtons();
        renderPosts();
        renderHotTopics();
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            currentTab = TAB_CATEGORY_MAP[btn.textContent.trim()];
            saveTab();
            renderAll();
        });
    });

    searchInput.addEventListener("input", () => {
        currentSearch = searchInput.value;
        saveSearch();
        renderPosts();
    });

    uploadBox.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            selectedImageDataUrl = reader.result;
            uploadBox.style.backgroundImage = `url(${selectedImageDataUrl})`;
            uploadBox.style.backgroundSize = "cover";
            uploadBox.innerHTML = "";
        };
        reader.readAsDataURL(file);
    });

    postListEl.addEventListener("click", e => {
        const like = e.target.closest(".community_post_likes");
        if (like) {
            const id = like.closest(".community_post_item").dataset.id;
            const post = allPosts.find(p => (p.postId || p.id) == id);
            if (!post) return;
            post.likes++;
            savePosts();
            renderAll();
            return;
        }

        const item = e.target.closest(".community_post_item");
        if (!item) return;

        const id = item.dataset.id;
        if (!id) return;

        window.location.href = `7_베지어스_community_post_wide.html?id=${id}`;
    });

    createBtn.addEventListener("click", () => {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            alert("로그인 후 이용 가능합니다.");
            if (confirm("로그인 하시겠습니까?")) window.location.href = "../login/7_베지어스_login.html";
            return;
        }

        const title = titleInput.value.trim();
        const text = descInput.value.trim();
        const categorySelect = document.getElementById("community_task_category");
        const selectedCategory = categorySelect.value;

        if (!title || !text) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }

        const newPostId = "p_" + Date.now();

        allPosts.unshift({
            postId: newPostId,
            id: currentUser,
            category: selectedCategory,
            title,
            text,
            authorName: currentUser,
            authorImage:
                "../../assets/images/7_user-profile1.jpg",
            badgeImage:
                "../../assets/images/7_badge_icon1.png",
            imageData: selectedImageDataUrl || "",
            restaurantId: incomingRestaurantId || null,
            likes: 0,
            createdAt: new Date().toISOString(),
            comments: []
        });

        savePosts();
        renderAll();

        titleInput.value = "";
        descInput.value = "";
        selectedImageDataUrl = null;
        uploadBox.style.backgroundImage = "none";
        uploadBox.innerHTML = `<img src="../../assets/images/7_Download.png">`;
    });

    // ---------------- 모달 ----------------

    const modalOverlay = document.getElementById("writeModal");
    const openModalBtn = document.querySelector(".open_modal_button");
    const closeModalBtn = document.querySelector(".write_modal_close");

    const modalTitle = document.getElementById("modal_title");
    const modalDesc = document.getElementById("modal_desc");
    const modalUploadBox = document.querySelector(".modal_upload_box");
    const modalIcon = document.getElementById("modal_upload_icon");
    const modalFileInput = document.getElementById("modal_file_input");
    const modalSubmit = document.querySelector(".modal_submit_button");

    let modalImageData = null;

    openModalBtn.addEventListener("click", () => {
        modalOverlay.style.display = "flex";
    });

    closeModalBtn.addEventListener("click", () => {
        modalOverlay.style.display = "none";
    });

    modalOverlay.addEventListener("click", e => {
        if (e.target === modalOverlay) modalOverlay.style.display = "none";
    });

    modalUploadBox.addEventListener("click", () => modalFileInput.click());

    modalFileInput.addEventListener("change", () => {
        const file = modalFileInput.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            modalImageData = reader.result;
            modalUploadBox.style.backgroundImage = `url(${modalImageData})`;
            modalUploadBox.style.backgroundSize = "cover";
            modalIcon.style.display = "none";
        };
        reader.readAsDataURL(file);
    });

    modalSubmit.addEventListener("click", () => {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            alert("로그인 후 이용 가능합니다.");
            if(confirm("로그인 하시겠습니까?")) window.location.href = "../login/7_베지어스_login.html";
            return;
        }

        const title = modalTitle.value.trim();
        const text = modalDesc.value.trim();

        if (!title || !text) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }

        const newPostId = "p_" + Date.now();

        allPosts.unshift({
            postId: newPostId,
            id: currentUser,
            category: currentTab,
            title,
            text,
            authorName: currentUser,
            authorImage: "../../assets/images/7_user-profile1.jpg",
            badgeImage: "../../assets/images/7_badge_icon1.png",
            imageData: modalImageData || "",
            restaurantId: incomingRestaurantId || null,
            likes: 0,
            createdAt: new Date().toISOString(),
            comments: []
        });

        savePosts();
        renderAll();

        modalTitle.value = "";
        modalDesc.value = "";
        modalImageData = null;
        modalUploadBox.style.backgroundImage = "none";
        modalIcon.style.display = "block";
        modalOverlay.style.display = "none";
    });

    hotTopicListEl.addEventListener("click", e => {
        const card = e.target.closest(".community_hot_topic_card");
        if (!card) return;

        const id = card.dataset.id;
        window.location.href = `7_베지어스_community_post_wide.html?id=${id}`;
    });

    function checkIncomingFromMap() {
        const params = new URLSearchParams(window.location.search);

        if (params.get("mode") === "write") {
            currentTab = "review";

            const rawId = params.get("restaurantId");
            incomingRestaurantId = rawId !== null ? Number(rawId) : null;

            saveTab();
            updateTabButtons();
            renderAll();

            const openModalBtn = document.querySelector(".open_modal_button");
            if (openModalBtn) {
                setTimeout(() => {
                    openModalBtn.click();
                }, 300);
            }
        }
    }

    async function init() {
        loadStateFromStorage();
        await loadRestaurantData();
        await loadPostsFromJson();
        renderAll();
        checkIncomingFromMap();
    }

    init();
});