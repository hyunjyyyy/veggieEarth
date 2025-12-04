
document.addEventListener("DOMContentLoaded", () => {
    initBannerLogic();
    loadFeaturedRecipes();
    initHeroSlider();
});

// 배너 클릭 시 이동 제한
function initBannerLogic() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const bannerLink = document.getElementById('login_banner');

    if (bannerLink) {
        bannerLink.addEventListener('click', function (event) {
            // 로그인 상태이면 이동을 막고 알림
            if (isLoggedIn === 'true') {
                event.preventDefault();
                alert("이미 가입을 완료하셨습니다:D");
            }
        });
    }
}

/*레시피 데이터 바인딩*/
async function loadFeaturedRecipes() {
    // 데이터 로딩
    const jsonPath = 'pages/recipe/recipes.json';

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

        const detailLink = `pages/recipe/recipe_detail.html?id=${recipe.id}`;

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
                            <span><img src="assets/images/served.png" alt="인분"> ${recipe.servings}</span>
                            <span><img src="assets/images/time.png" alt="소요시간"> ${recipe.time}</span>
                            <span><img src="assets/images/difficulty.png" alt="난이도"> ${recipe.difficulty}</span>
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