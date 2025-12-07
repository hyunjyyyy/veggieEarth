
document.addEventListener("DOMContentLoaded", () => {
    initBannerLogic();
    loadFeaturedRecipes();
    loadRecommendedPosts();
    initHeroSlider();
});

// 배너 클릭 시 이동 제한
function initBannerLogic() {
    const currentUser = localStorage.getItem('currentUser');
    const bannerLink = document.getElementById('login_banner');

    if (bannerLink) {
        bannerLink.addEventListener('click', function (event) {
            // 로그인 상태이면 이동을 막고 알림
            if (currentUser) {
                event.preventDefault();
                alert("이미 가입을 완료하셨습니다:D");
            }
        });
    }
}

/*레시피 데이터 바인딩*/
async function loadFeaturedRecipes() {
    // 데이터 로딩
    const jsonPath = 'pages/recipe/7_베지어스_recipes.json';

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error("데이터 로드 실패");
        }
        const allRecipes = await response.json();

        // 인기 레시피 : 평점 높은 순 -> 리뷰 많은 순
        const sortedRecipes = allRecipes.sort((a, b) => {
            if (b.rating !== a.rating) {
                return b.rating - a.rating;
            }
            return b.reviews - a.reviews;
        });

        const featuredRecipes = sortedRecipes.slice(0, 4);
        renderFeaturedRecipes(featuredRecipes);

    } catch (error) {
        console.error("추천 레시피 로드 실패:", error);
    }
}

function renderFeaturedRecipes(recipes) {
    const listContainer = document.getElementById("featured-recipe-list");
    listContainer.innerHTML = "";

    recipes.forEach(recipe => {
        const starCount = Math.floor(recipe.rating);
        const stars = "★".repeat(starCount) + "☆".repeat(5 - starCount);

        const iconsHtml = recipe.icons.map(icon => `<span class="icon ${icon}"></span>`).join('');

        const imagePath = recipe.image.replace('../../', '');

        const detailLink = `pages/recipe/7_베지어스_recipe_detail.html?id=${recipe.id}`;

        const cardHtml = `
            <a href="${detailLink}" class="recipe_card_link">
                <div class="recipe_card">
                    <div class="recipe_card_image_box" style="background-image:url('${imagePath}')">
                        <div class="recipe_card_icons">
                            ${iconsHtml}
                        </div>
                    </div>
                    <div class="recipe_card_content">
                        <h4>${recipe.title}</h4>
                        <div class="recipe_card_meta">
                            <span><img src="assets/images/7_served.png" alt="인분"> ${recipe.servings}</span>
                            <span><img src="assets/images/7_time.png" alt="소요시간"> ${recipe.time}</span>
                            <span><img src="assets/images/7_difficulty.png" alt="난이도"> ${recipe.difficulty}</span>
                        </div>
                        <div class="recipe_card_rating">
                            <span>${stars}</span> (${recipe.reviews})
                        </div>
                    </div>
                </div>
            </a>
        `;
        listContainer.insertAdjacentHTML("beforeend", cardHtml);
    });
}
/* 메인 포스터 슬라이드 */
function initHeroSlider() {
    const track = document.getElementById("hero-slider-track");
    const slides = document.querySelectorAll(".slide");
    const prevBtn = document.getElementById("btn-prev");
    const nextBtn = document.getElementById("btn-next");
    const dotsContainer = document.getElementById("slider-dots");

    let currentIndex = 0;
    const slideCount = slides.length;

    slides.forEach((_, index) => {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        if (index === 0) dot.classList.add("active");

        dot.addEventListener("click", () => {
            currentIndex = index;
            updateSlider();
            resetAutoSlide(); // 수동 조작 시 타이머 초기화
        });

        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll(".dot");

    function updateSlider() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        dots.forEach(dot => dot.classList.remove("active"));
        dots[currentIndex].classList.add("active");
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slideCount; // 마지막 장에서 0으로 돌아감
        updateSlider();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slideCount) % slideCount; // 0에서 뒤로 가면 마지막으로
        updateSlider();
    }

    nextBtn.addEventListener("click", () => {
        nextSlide();
        resetAutoSlide();
    });

    prevBtn.addEventListener("click", () => {
        prevSlide();
        resetAutoSlide();
    });

    let autoSlideInterval = setInterval(nextSlide, 3000);

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 3000);
    }
}

/*게시글 데이터 바인딩*/
async function loadRecommendedPosts() {
    const jsonPath = './pages/community/7_베지어스_community_posts.json';

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error("데이터 로드 실패");

        const data = await response.json();

        // 추천 게시글 - 좋아요 높은 순으로 3개
        const sortedPosts = data.posts.sort((a, b) => b.likes - a.likes);
        const topPosts = sortedPosts.slice(0, 3);

        renderRecommendedPosts(topPosts);

    } catch (error) {
        console.error("추천 포스트 로드 에러:", error);
    }
}

function renderRecommendedPosts(posts) {
    const container = document.getElementById("rmd_post_list");
    if (!container) return;

    container.innerHTML = "";

    posts.forEach(post => {
        const authorImg = post.authorImage ? post.authorImage.replace('../../', './') : './assets/images/7_Profile3.png';
        const badgeImg = post.badgeImage ? post.badgeImage.replace('../../', './') : './assets/images/7_badge-icon.png';

        let postImg = post.image ? post.image.replace('../../', './') : '';
        if (!postImg) postImg = './assets/images/7_logo.png';

        const heartIcon = "./assets/images/7_Heart.png";
        const detailLink = `./pages/community/7_베지어스_community_post_wide.html?id=${post.postId}`;

        const timeLabel = timeAgo(post.createdAt);

        const html = `
            <a href="${detailLink}" style="text-decoration:none; color:inherit; display:block; margin-bottom:15px;">
                <div class="community_post_item community_post_box">
                    <div class="community_post_main_wrapper">

                        <div class="community_post_text_wrap">
                            <div class="community_post_header">
                                <img src="${authorImg}" alt="프로필" class="community_user_profile_img">
                                <span class="community_user_name">${post.authorName}</span>
                                <img src="${badgeImg}" alt="뱃지" class="community_user_badge_img">
                            </div>

                            <div class="community_post_content">
                                <p class="community_post_title">${post.title}</p>
                                <p class="community_post_text">${post.text}</p>
                            </div>

                            <div class="community_post_meta">
                                <span class="community_post_time">${timeLabel}</span>
                                <span class="community_post_likes">
                                    ${post.likes} <img src="${heartIcon}" alt="좋아요">
                                </span>
                            </div>
                        </div>

                        <div class="community_post_image_box">
                            <img src="${postImg}" alt="게시글 이미지">
                        </div>
                    </div>
                </div>
            </a>
        `;
        container.insertAdjacentHTML("beforeend", html);
    });
}

// 시간 차이 계산 함수
function timeAgo(dateString) {
    const now = new Date();
    const postDate = new Date(dateString);
    const seconds = Math.floor((now - postDate) / 1000);

    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;

    return postDate.toLocaleDateString('ko-KR');
}