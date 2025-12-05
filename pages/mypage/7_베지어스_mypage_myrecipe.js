document.addEventListener("DOMContentLoaded", () => {
    const CURRENT_USER_ID = "pxibvaw"; 
    const JSON_PATH = "../recipe/recipes.json"; 

    const recipeListContainer = document.getElementById("recipe-list");
    const uploadBtn = document.getElementById("mypage_myrecipe_upload_btn");
    const scrapBtn = document.getElementById("mypage_myrecipe_scrap_btn");
    
    const searchInput = document.querySelector(".mypage_myrecipe_search_input");
    const searchBtn = document.querySelector(".mypage_myrecipe_search_btn");

    let allRecipesData = [];
    let currentTab = 'upload';

    fetch(JSON_PATH)
        .then(res => res.json())
        .then(data => {
            allRecipesData = Array.isArray(data) ? data : (data.recipes || []);
            filterAndRender();
        })
        .catch(err => {
            console.error(err);
            recipeListContainer.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding:30px;">데이터를 불러올 수 없습니다.</p>';
        });

    uploadBtn.addEventListener("click", () => setTab('upload'));
    scrapBtn.addEventListener("click", () => setTab('scrap'));

    searchInput.addEventListener("input", filterAndRender);
    searchBtn.addEventListener("click", filterAndRender);
    
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            filterAndRender();
        }
    });

    function setTab(tabName) {
        currentTab = tabName;

        if (tabName === 'upload') {
            uploadBtn.classList.add('active');
            scrapBtn.classList.remove('active');
        } else {
            uploadBtn.classList.remove('active');
            scrapBtn.classList.add('active');
        }
        
        filterAndRender();
    }

    function filterAndRender() {
        const searchText = searchInput.value.toLowerCase().trim();
        
        const filtered = allRecipesData.filter(recipe => {
            // 1. 탭 필터링
            let matchTab = false;
            if (currentTab === 'upload') {
                matchTab = (recipe.author === CURRENT_USER_ID);
            } else {
                matchTab = (recipe.scrap === 1);
            }

            // 2. 검색 필터링 (# 유무에 따른 분기)
            let matchSearch = true;
            if (searchText) {
                if (searchText.startsWith('#')) {
                    // #으로 시작하면 -> 해시태그 검색 (# 제거 후 비교)
                    const keyword = searchText.substring(1); 
                    matchSearch = recipe.hashtags && recipe.hashtags.some(tag => tag.toLowerCase().includes(keyword));
                } else {
                    // #이 없으면 -> 제목 검색
                    matchSearch = recipe.title.toLowerCase().includes(searchText);
                }
            }

            return matchTab && matchSearch;
        });

        renderRecipes(filtered);
    }

    function renderRecipes(recipes) {
        recipeListContainer.innerHTML = "";

        if (recipes.length === 0) {
            const searchText = searchInput.value.trim();
            let msg = "";
            
            if (searchText) {
                msg = `"${searchText}"에 대한 검색 결과가 없습니다.`;
            } else {
                msg = currentTab === 'upload' ? "업로드한 레시피가 없습니다." : "스크랩한 레시피가 없습니다.";
            }

            recipeListContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:50px; color:#888;">${msg}</p>`;
            return;
        }

        recipes.forEach(recipe => {
            const starCount = Math.floor(recipe.rating || 0);
            const stars = "★".repeat(starCount) + "☆".repeat(5 - starCount);
            
            const iconsHtml = (recipe.icons || []).map(icon => `<span class="icon ${icon}"></span>`).join('');
            const imagePath = recipe.image || "../../assets/images/default_food.png";

            const cardHtml = `
                <a href="../recipe/recipe_detail.html?id=${recipe.id}" class="recipe_card_link">
                    <div class="recipe_card">
                        <div class="recipe_card_image_box" style="background-image:url('${imagePath}')">
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
                                <span>${stars}</span> (${recipe.reviews || 0})
                            </div>
                        </div>
                    </div>
                </a>
            `;
            
            recipeListContainer.insertAdjacentHTML("beforeend", cardHtml);
        });
    }
});