// 전역 변수: 현재 선택된 별점 (기본 5점), 현재 레시피 ID
let currentRatingInput = 5;
let currentRecipeId = null; 

document.addEventListener("DOMContentLoaded", () => {
    // 1. URL에서 레시피 ID 가져오기
    const params = new URLSearchParams(window.location.search);
    currentRecipeId = parseInt(params.get("id"));

    // ID가 없으면 메인으로 돌려보냄
    if (!currentRecipeId) {
        alert("잘못된 접근입니다.");
        location.href = "recipe_main.html";
        return;
    }

    // 2. 데이터 로드 및 렌더링
    loadRecipeDetail(currentRecipeId);

    // 3. 별점 클릭 이벤트 연결 (후기 작성용)
    document.querySelectorAll(".star_btn").forEach(star => {
        star.addEventListener("click", function() {
            currentRatingInput = parseInt(this.dataset.value);
            updateStarUI(currentRatingInput);
        });
    });
});

// 별점 UI 업데이트 함수
function updateStarUI(score) {
    document.querySelectorAll(".star_btn").forEach(star => {
        const val = parseInt(star.dataset.value);
        if (val <= score) star.classList.add("selected");
        else star.classList.remove("selected");
    });
}

async function loadRecipeDetail(id) {
    // 로컬스토리지 우선, 없으면 JSON fetch
    let recipes = JSON.parse(localStorage.getItem("allRecipes"));

    if (!recipes) {
        try {
            // 경로가 data 폴더 안에 있다면 ./data/recipes.json 일 수도 있음. 
            // 현재 페이지 위치에 따라 다르므로 주의 (여기선 기본값 유지)
            const response = await fetch("./data/recipes.json"); 
            recipes = await response.json();
            localStorage.setItem("allRecipes", JSON.stringify(recipes));
        } catch (e) {
            console.error("데이터 로드 실패:", e);
            return;
        }
    }

    // 현재 ID에 해당하는 레시피 찾기
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) {
        alert("레시피를 찾을 수 없습니다.");
        location.href = "recipe_main.html";
        return;
    }

    renderDetail(recipe);
}

function renderDetail(recipe) {
    // 1. 기본 정보 & 작성자 표시
    document.title = `${recipe.title} - 베지어스`;
    document.getElementById("recipeTitle").textContent = recipe.title;
    document.getElementById("recipeAuthor").textContent = recipe.author || "익명"; 
    document.getElementById("recipeDescription").textContent = recipe.description;
    document.getElementById("recipeHeroImage").style.backgroundImage = `url('${recipe.image}')`;

    // 메타 정보
    document.getElementById("metaServings").innerHTML = `<img src="../../assets/images/served.png"> ${recipe.servings}`;
    document.getElementById("metaTime").innerHTML = `<img src="../../assets/images/time.png"> ${recipe.time}`;
    document.getElementById("metaDifficulty").innerHTML = `<img src="../../assets/images/difficulty.png"> ${recipe.difficulty}`;

    // 해시태그
    const tagContainer = document.getElementById("recipeHashtags");
    if (recipe.hashtags) {
        tagContainer.innerHTML = recipe.hashtags.map(tag => `<a href="#" class="hashtag">${tag}</a>`).join('');
    }

    // 재료 목록
    const ingContainer = document.getElementById("ingredientContainer");
    let ingHtml = "";
    if (recipe.ingredientGroups && recipe.ingredientGroups.length > 0) {
        recipe.ingredientGroups.forEach(group => {
            ingHtml += `<h4>${group.category}</h4><ul class="recipe_ingredient_list">`;
            group.items.forEach(item => {
                ingHtml += `<li><label><input type="checkbox"> ${item.name} <span>${item.amount}</span></label></li>`;
            });
            ingHtml += `</ul>`;
        });
    } else {
        ingHtml = "<p>등록된 재료 정보가 없습니다.</p>";
    }
    ingContainer.innerHTML = ingHtml;

    // 조리 과정
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

    // ★ 스크랩(북마크) 상태 확인 및 이벤트 연결
    handleScrap(recipe);

    // 후기 리스트 렌더링
    renderReviews(recipe);
}

// ★ 스크랩(북마크) 처리 함수 (JSON 데이터 기반)
function handleScrap(recipe) {
    const bookmarkBtn = document.getElementById("recipeBookmark");
    
    // 1. 현재 상태 반영 (recipe.scrap 값이 1이면 체크됨)
    bookmarkBtn.checked = (recipe.scrap === 1);

    // 2. 클릭(변경) 이벤트
    // 기존 이벤트 리스너 중복 방지를 위해 onchange 프로퍼티 사용 권장 혹은 replaceNode
    // 여기서는 간단히 onclick으로 처리
    bookmarkBtn.onclick = function(e) {
        const isChecked = e.target.checked;
        const newScrapStatus = isChecked ? 1 : 0; // 1: 스크랩, 0: 해제

        // 전체 데이터 가져오기
        const allRecipes = JSON.parse(localStorage.getItem("allRecipes"));
        const index = allRecipes.findIndex(r => r.id === recipe.id);
        
        if (index !== -1) {
            // 데이터 업데이트
            allRecipes[index].scrap = newScrapStatus;
            
            // 저장
            localStorage.setItem("allRecipes", JSON.stringify(allRecipes));
            
            // 현재 보고 있는 객체 업데이트 (화면 싱크)
            recipe.scrap = newScrapStatus;
        }
    };
}

function renderReviews(recipe) {
    const container = document.getElementById("reviewListContainer");
    const countBadge = document.getElementById("reviewCountBadge");
    
    // 후기 개수
    const reviewCount = recipe.reviewList ? recipe.reviewList.length : 0;
    countBadge.textContent = `(${reviewCount})`;

    if (!recipe.reviewList || recipe.reviewList.length === 0) {
        container.innerHTML = `<p style="padding:20px; color:#aaa;">아직 등록된 후기가 없어요. 첫 후기를 남겨주세요!</p>`;
        return;
    }

    // 최신순 정렬
    const sortedReviews = [...recipe.reviewList].reverse();

    container.innerHTML = sortedReviews.map(review => `
        <div class="review_item">
            <div class="review_user_row">
                <span class="review_user_id">${review.user}</span>
                <span class="review_date">${review.date}</span>
            </div>
            <div style="margin-bottom:5px;">
                <span class="review_stars">${"★".repeat(review.rating)}${"☆".repeat(5-review.rating)}</span>
            </div>
            <div class="review_text">${review.text}</div>
        </div>
    `).join('');
}

// 후기 등록 함수
function submitReview() {
    const text = document.getElementById("reviewText").value;
    
    if (!text.trim()) {
        alert("후기 내용을 입력해주세요!");
        return;
    }

    const allRecipes = JSON.parse(localStorage.getItem("allRecipes"));
    const recipeIndex = allRecipes.findIndex(r => r.id === currentRecipeId);
    
    if (recipeIndex === -1) return;

    const recipe = allRecipes[recipeIndex];

    const newReview = {
        user: "guest" + Math.floor(Math.random() * 1000), 
        text: text,
        rating: currentRatingInput,
        date: new Date().toISOString().split('T')[0]
    };

    if (!recipe.reviewList) recipe.reviewList = [];
    recipe.reviewList.push(newReview);

    // 평균 별점 재계산
    recipe.reviews = recipe.reviewList.length;
    const sum = recipe.reviewList.reduce((acc, cur) => acc + cur.rating, 0);
    recipe.rating = (sum / recipe.reviews).toFixed(1);

    allRecipes[recipeIndex] = recipe;
    localStorage.setItem("allRecipes", JSON.stringify(allRecipes));

    alert("후기가 등록되었습니다!");
    document.getElementById("reviewText").value = ""; 
    
    // 현재 화면 업데이트
    renderDetail(recipe);
}