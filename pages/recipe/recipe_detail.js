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

// 전역 변수: 현재 선택된 별점 (기본 5점)
let currentRatingInput = 5;
let currentRecipeId = null; // ID 저장용

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    currentRecipeId = parseInt(params.get("id"));

    if (!currentRecipeId) {
        alert("잘못된 접근입니다.");
        location.href = "recipe_main.html";
        return;
    }

    loadRecipeDetail(currentRecipeId);

    // 별점 클릭 이벤트 연결
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
    let recipes = JSON.parse(localStorage.getItem("allRecipes"));

    if (!recipes) {
        try {
            const response = await fetch("./data/recipes.json"); // 경로 주의
            recipes = await response.json();
            localStorage.setItem("allRecipes", JSON.stringify(recipes));
        } catch (e) {
            console.error("데이터 로드 실패:", e);
            return;
        }
    }

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
    document.getElementById("recipeAuthor").textContent = recipe.author || "익명"; // ★ 작성자 표시
    document.getElementById("recipeDescription").textContent = recipe.description;
    document.getElementById("recipeHeroImage").style.backgroundImage = `url('${recipe.image}')`;

    // 메타 정보
    document.getElementById("metaServings").innerHTML = `<img src="../../assets/images/served.png"> ${recipe.servings}`;
    document.getElementById("metaTime").innerHTML = `<img src="../../assets/images/time.png"> ${recipe.time}`;
    document.getElementById("metaDifficulty").innerHTML = `<img src="../../assets/images/difficulty.png"> ${recipe.difficulty}`;

    // 해시태그
    const tagContainer = document.getElementById("recipeHashtags");
    tagContainer.innerHTML = recipe.hashtags.map(tag => `<a href="#" class="hashtag">${tag}</a>`).join('');

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

    // 북마크
    handleBookmark(recipe.id);

    // ★ 후기 리스트 렌더링
    renderReviews(recipe);
}

function renderReviews(recipe) {
    const container = document.getElementById("reviewListContainer");
    const countBadge = document.getElementById("reviewCountBadge");
    
    // 후기 개수 업데이트
    const reviewCount = recipe.reviewList ? recipe.reviewList.length : 0;
    countBadge.textContent = `(${reviewCount})`;

    if (!recipe.reviewList || recipe.reviewList.length === 0) {
        container.innerHTML = `<p style="padding:20px; color:#aaa;">아직 등록된 후기가 없어요. 첫 후기를 남겨주세요!</p>`;
        return;
    }

    // 최신순 정렬하여 표시
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

// ★ 후기 등록 함수
function submitReview() {
    const text = document.getElementById("reviewText").value;
    
    if (!text.trim()) {
        alert("후기 내용을 입력해주세요!");
        return;
    }

    // 1. 전체 데이터 가져오기
    const allRecipes = JSON.parse(localStorage.getItem("allRecipes"));
    // 2. 현재 레시피 찾기
    const recipeIndex = allRecipes.findIndex(r => r.id === currentRecipeId);
    
    if (recipeIndex === -1) return;

    const recipe = allRecipes[recipeIndex];

    // 3. 새 후기 객체 생성
    const newReview = {
        user: "guest" + Math.floor(Math.random() * 1000), // 임의의 유저명
        text: text,
        rating: currentRatingInput,
        date: new Date().toISOString().split('T')[0]
    };

    // 4. 데이터 업데이트
    if (!recipe.reviewList) recipe.reviewList = [];
    recipe.reviewList.push(newReview);

    // 5. 평균 별점 및 개수 재계산
    recipe.reviews = recipe.reviewList.length;
    const sum = recipe.reviewList.reduce((acc, cur) => acc + cur.rating, 0);
    recipe.rating = (sum / recipe.reviews).toFixed(1); // 소수점 한자리

    // 6. 저장
    allRecipes[recipeIndex] = recipe;
    localStorage.setItem("allRecipes", JSON.stringify(allRecipes));

    // 7. 화면 갱신
    alert("후기가 등록되었습니다!");
    document.getElementById("reviewText").value = ""; // 입력창 초기화
    renderReviews(recipe); // 리스트 다시 그리기
}

function handleBookmark(id) {
    const bookmarkBtn = document.getElementById("recipeBookmark");
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
    
    if (bookmarks.includes(id)) {
        bookmarkBtn.checked = true;
    }

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