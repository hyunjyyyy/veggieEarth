document.addEventListener("DOMContentLoaded", () => {
    const CURRENT_USER_ID = localStorage.getItem('currentUser');
    
    if (!CURRENT_USER_ID) {
        alert("로그인이 필요합니다.");
        window.location.href = "../../pages/login/login.html";
        return;
    }
    
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

    /* 7_베지어스_mypage_myrecipe.js 수정 */

    function filterAndRender() {
        const searchText = searchInput.value.toLowerCase().trim();
        
        // ★ [수정 1] 내 스크랩 목록 가져오기 (새로운 방식)
        // 저장 구조: { "user1": [1, 2], "user2": [3] }
        const scrapData = JSON.parse(localStorage.getItem('scrappedRecipes')) || {};
        const myScraps = scrapData[CURRENT_USER_ID] || []; // 로그인한 유저의 스크랩 ID 배열 (예: [1, 5, 8])

        const filtered = allRecipesData.filter(recipe => {
            // 1. 탭 필터링
            let matchTab = false;
            if (currentTab === 'upload') {
                // 업로드 탭: 내가 쓴 글인지 확인
                matchTab = (recipe.author === CURRENT_USER_ID);
            } else {
                // ★ [수정 2] 스크랩 탭: 'myScraps' 배열에 이 레시피 ID가 들어있는지 확인
                // (기존 코드: recipe.scrap === 1  <-- 이거 삭제됨)
                matchTab = myScraps.includes(recipe.id);
            }

            // 2. 검색 필터링 (# 유무에 따른 분기 - 기존 동일)
            let matchSearch = true;
            if (searchText) {
                if (searchText.startsWith('#')) {
                    const keyword = searchText.substring(1); 
                    matchSearch = recipe.hashtags && recipe.hashtags.some(tag => tag.toLowerCase().includes(keyword));
                } else {
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