document.addEventListener("DOMContentLoaded", () => {
    // 1. URL에서 레시피 ID 가져오기
    const params = new URLSearchParams(window.location.search);
    const recipeId = parseInt(params.get("id"));

    // ID가 없으면 메인으로 돌려보냄 (예외처리)
    if (!recipeId) {
        alert("잘못된 접근입니다.");
        location.href = "recipe_main.html";
        return;
    }

    loadRecipeDetail(recipeId);
});

async function loadRecipeDetail(id) {
    // 2. 데이터 가져오기 (로컬스토리지 우선, 없으면 JSON fetch)
    let recipes = JSON.parse(localStorage.getItem("allRecipes"));

    if (!recipes) {
        try {
            const response = await fetch("recipes.json");
            recipes = await response.json();
            localStorage.setItem("allRecipes", JSON.stringify(recipes));
        } catch (e) {
            console.error("데이터 로드 실패:", e);
            return;
        }
    }

    // 3. 현재 ID에 해당하는 레시피 찾기
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) {
        alert("레시피를 찾을 수 없습니다.");
        location.href = "recipe_main.html";
        return;
    }

    // 4. 화면에 데이터 뿌리기
    renderDetail(recipe);
}

function renderDetail(recipe) {
    // 기본 정보
    document.title = `${recipe.title} - 베지어스`;
    document.getElementById("recipeTitle").textContent = recipe.title;
    document.getElementById("recipeDescription").textContent = recipe.description;
    
    // 이미지 (URL 방식)
    document.getElementById("recipeHeroImage").style.backgroundImage = `url('${recipe.image}')`;

    // 메타 정보
    document.getElementById("metaServings").innerHTML = `<img src="../../assets/images/served.png"> ${recipe.servings}`;
    document.getElementById("metaTime").innerHTML = `<img src="../../assets/images/time.png"> ${recipe.time}`;
    document.getElementById("metaDifficulty").innerHTML = `<img src="../../assets/images/difficulty.png"> ${recipe.difficulty}`;

    // 해시태그
    const tagContainer = document.getElementById("recipeHashtags");
    tagContainer.innerHTML = recipe.hashtags.map(tag => `<a href="#" class="hashtag">${tag}</a>`).join('');

    // ★ 재료 목록 (그룹별 렌더링)
    const ingContainer = document.getElementById("ingredientContainer");
    let ingHtml = "";
    
    // JSON의 ingredientGroups 배열을 돕니다
    if (recipe.ingredientGroups && recipe.ingredientGroups.length > 0) {
        recipe.ingredientGroups.forEach(group => {
            // 그룹 제목 (예: [주재료])
            ingHtml += `<h4>${group.category}</h4>`;
            ingHtml += `<ul class="recipe_ingredient_list">`;
            
            // 그룹 내 아이템들
            group.items.forEach(item => {
                ingHtml += `
                    <li>
                        <label>
                            <input type="checkbox"> ${item.name} <span>${item.amount}</span>
                        </label>
                    </li>`;
            });
            ingHtml += `</ul>`;
        });
    } else {
        ingHtml = "<p>등록된 재료 정보가 없습니다.</p>";
    }
    ingContainer.innerHTML = ingHtml;

    // ★ 조리 과정
    const stepList = document.getElementById("stepList");
    if (recipe.steps && recipe.steps.length > 0) {
        stepList.innerHTML = recipe.steps.map(step => `
            <li>
                <img src="${step.img ? step.img : '../../assets/images/logo.png'}" alt="조리과정">
                <p>${step.desc}</p>
            </li>
        `).join('');
    } else {
        stepList.innerHTML = "<p>조리 과정 정보가 준비 중입니다.</p>";
    }

    // 북마크 상태 확인 및 이벤트 연결
    handleBookmark(recipe.id);
}

function handleBookmark(id) {
    const bookmarkBtn = document.getElementById("recipeBookmark");
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
    
    // 이미 북마크 되어있으면 체크 표시
    if (bookmarks.includes(id)) {
        bookmarkBtn.checked = true;
    }

    // 클릭 시 저장/삭제
    bookmarkBtn.addEventListener("change", (e) => {
        let currentBookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
        
        if (e.target.checked) {
            if (!currentBookmarks.includes(id)) currentBookmarks.push(id);
        } else {
            currentBookmarks = currentBookmarks.filter(bid => bid !== id);
        }
        
        localStorage.setItem("bookmarks", JSON.stringify(currentBookmarks));
    });
}