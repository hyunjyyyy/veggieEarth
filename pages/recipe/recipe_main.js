// 전역 변수: 현재 정렬 모드 (기본값: 추천순)
let currentSortMode = "recommend"; 

document.addEventListener("DOMContentLoaded", () => {
    // 1. 초기 데이터 로드
    loadRecipeData();

    // 2. 검색 및 필터 이벤트 연결
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", filterRecipes);

    const inputs = document.querySelectorAll('input[name="cuisine_type"], input[type="checkbox"]');
    inputs.forEach(input => {
        input.addEventListener("change", filterRecipes);
    });

    // 3. ★ 정렬 버튼 이벤트 연결
    const sortButtons = document.querySelectorAll(".recipe_sort_button");
    sortButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            // 모든 버튼에서 active 제거 후 클릭한 것에만 추가
            sortButtons.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");

            // 정렬 모드 설정 (텍스트 내용으로 구분)
            const text = e.target.textContent;
            if (text === "최신순") currentSortMode = "newest";
            else if (text === "정확순") currentSortMode = "accuracy";
            else currentSortMode = "recommend"; // 추천순

            // 필터 및 정렬 다시 실행
            filterRecipes();
        });
    });
});

async function loadRecipeData() {
    let recipes = localStorage.getItem("allRecipes");
    if (!recipes) {
        try {
            const response = await fetch("recipes.json"); // data 폴더 위치 확인!
            const data = await response.json();
            localStorage.setItem("allRecipes", JSON.stringify(data));
            renderRecipes(data); // 초기 렌더링 시에는 그냥 데이터를 넘김 (필터 함수 내부에서 정렬 처리)
            filterRecipes(); // 정렬 적용을 위해 필터 함수 호출
        } catch (error) {
            console.error("데이터 로드 실패:", error);
        }
    } else {
        filterRecipes(); // 정렬 적용을 위해 필터 함수 호출
    }
}

function renderRecipes(recipes) {
    const listContainer = document.getElementById("recipe-list");
    const countSpan = document.querySelector(".recipe_count.num");
    
    listContainer.innerHTML = "";
    countSpan.textContent = `${recipes.length}개`;

    recipes.forEach(recipe => {
        const starCount = Math.floor(recipe.rating);
        const stars = "★".repeat(starCount) + "☆".repeat(5 - starCount);
        const iconsHtml = recipe.icons.map(icon => `<span class="icon ${icon}"></span>`).join('');

        const cardHtml = `
            <a href="recipe_detail.html?id=${recipe.id}" class="recipe_card_link">
                <div class="recipe_card">
                    <div class="recipe_card_image_box" style="background-image:url(${recipe.image})">
                        <div class="recipe_card_icons">
                            ${iconsHtml}
                        </div>
                    </div>
                    <div class="recipe_card_content">
                        <h4>${recipe.title}</h4>
                        <div class="recipe_card_meta">
                            <span><img src="../../assets/images/served.png" alt="인분"> ${recipe.servings}</span>
                            <span><img src="../../assets/images/time.png" alt="소요시간"> ${recipe.time}</span>
                            <span><img src="../../assets/images/difficulty.png" alt="난이도"> ${recipe.difficulty}</span>
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

function filterRecipes() {
    const allRecipes = JSON.parse(localStorage.getItem("allRecipes")) || [];
    const searchText = document.getElementById("searchInput").value.toLowerCase();
    
    // 라디오 버튼 (카테고리)
    const selectedCategoryRadio = document.querySelector('input[name="cuisine_type"]:checked');
    const selectedCategory = selectedCategoryRadio ? selectedCategoryRadio.id.replace('radio_', '') : 'all';

    // 체크박스 (재료)
    const checkedIcons = Array.from(document.querySelectorAll('.recipe_filter_item input[type="checkbox"]:checked'))
                              .map(cb => cb.id.replace('chk_', ''));
    
    const iconMap = {
        "veg": "veggie", "fruit": "fruit", "dairy": "milk", "egg": "egg",
        "seafood": "fish", "poultry": "poultry", "meat": "meat"
    };

    // 1. 필터링
    let filtered = allRecipes.filter(recipe => {
        // 검색어
        const matchSearch = recipe.title.toLowerCase().includes(searchText) || 
                            (recipe.hashtags && recipe.hashtags.some(tag => tag.includes(searchText)));

        // 카테고리
        let matchCategory = true;
        if (selectedCategory !== 'all') {
            matchCategory = (recipe.category === selectedCategory);
        }

        // ★ [수정됨] 재료 필터 (AND 로직: every 사용)
        let matchIcon = true;
        if (checkedIcons.length > 0) {
            // 체크된 모든(every) 아이콘이 레시피에 포함되어 있어야 함
            matchIcon = checkedIcons.every(checkId => {
                const jsonValue = iconMap[checkId] || checkId; 
                return recipe.icons.includes(jsonValue);
            });
        }

        return matchSearch && matchCategory && matchIcon;
    });

    // 2. 정렬 (Sorting)
    filtered.sort((a, b) => {
        if (currentSortMode === "newest") {
            return new Date(b.date) - new Date(a.date);
        } else if (currentSortMode === "recommend") {
            return b.rating - a.rating;
        } else {
            return a.id - b.id;
        }
    });

    renderRecipes(filtered);
}