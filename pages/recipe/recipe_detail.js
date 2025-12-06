// 전역 변수
let currentRatingInput = 5;
let currentRecipeId = null; 

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    currentRecipeId = parseInt(params.get("id"));

    if (!currentRecipeId) {
        alert("잘못된 접근입니다.");
        location.href = "recipe_main.html";
        return;
    }

    loadRecipeDetail(currentRecipeId);

    document.querySelectorAll(".star_btn").forEach(star => {
        star.addEventListener("click", function() {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                alert("로그인 후 별점을 남길 수 있습니다.");
                if(confirm("로그인 하시겠습니까?")) {
                     window.location.href = "../login/login.html";
                }
                return;
            }
            currentRatingInput = parseInt(this.dataset.value);
            updateStarUI(currentRatingInput);
        });
    });

    const reviewInput = document.getElementById("reviewText");
    
    if (reviewInput) {
        reviewInput.addEventListener("focus", function() {
            const currentUser = localStorage.getItem('currentUser');
            
            if (!currentUser) {
                alert("로그인 후 후기를 작성할 수 있습니다.");
                this.blur();
                
                if(confirm("로그인 하시겠습니까?")) {
                     window.location.href = "../login/login.html";
                }
            }
        });
    }
});

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
            const response = await fetch("recipes.json"); 
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
    document.title = `${recipe.title} - 베지어스`;
    document.getElementById("recipeTitle").textContent = recipe.title;
    
    // 작성자 표시
    const authorName = recipe.author || "익명";
    document.getElementById("recipeAuthor").textContent = authorName;
    
    const authorContainer = document.querySelector(".author_info");
    
    const oldModBtn = document.getElementById("btnRecipeModify");
    const oldDelBtn = document.getElementById("btnRecipeDelete");
    if(oldModBtn) oldModBtn.remove();
    if(oldDelBtn) oldDelBtn.remove();

    // 현재 사용자 가져오기
    const currentUser = localStorage.getItem('currentUser');

    if (recipe.author && currentUser === currentUser) {
        // 1. 수정 버튼
        const modBtn = document.createElement("button");
        modBtn.className = "btn_modify";
        modBtn.id = "btnRecipeModify";
        modBtn.title = "수정";
        modBtn.innerHTML = `<img src="../../assets/images/modify.png" alt="수정">`;
        modBtn.onclick = function() {
            alert("레시피 수정 페이지로 이동합니다. (기능 준비중)");
        };
        authorContainer.appendChild(modBtn);

        // 2. 삭제 버튼 (★추가됨)
        const delBtn = document.createElement("button");
        delBtn.className = "btn_delete";
        delBtn.id = "btnRecipeDelete";
        delBtn.title = "삭제";
        delBtn.innerHTML = `<img src="../../assets/images/delete.png" alt="삭제">`; // 아이콘 필요
        delBtn.onclick = function() {
            if(confirm("정말 이 레시피를 삭제하시겠습니까?")) {
                deleteRecipe(recipe.id);
            }
        };
        authorContainer.appendChild(delBtn);
    }

    document.getElementById("recipeDescription").textContent = recipe.description;
    document.getElementById("recipeHeroImage").style.backgroundImage = `url('${recipe.image}')`;

    document.getElementById("metaServings").innerHTML = `<img src="../../assets/images/served.png"> ${recipe.servings}`;
    document.getElementById("metaTime").innerHTML = `<img src="../../assets/images/time.png"> ${recipe.time}`;
    document.getElementById("metaDifficulty").innerHTML = `<img src="../../assets/images/difficulty.png"> ${recipe.difficulty}`;

    const tagContainer = document.getElementById("recipeHashtags");
    if (recipe.hashtags) {
        tagContainer.innerHTML = recipe.hashtags.map(tag => `<a href="#" class="hashtag">${tag}</a>`).join('');
    }

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

    handleScrap(recipe);
    renderReviews(recipe);
}

// ★ [추가됨] 레시피 삭제 함수
function deleteRecipe(id) {
    let allRecipes = JSON.parse(localStorage.getItem("allRecipes"));
    // 해당 ID를 제외한 나머지로 배열 필터링
    const newRecipes = allRecipes.filter(r => r.id !== id);
    
    localStorage.setItem("allRecipes", JSON.stringify(newRecipes));
    alert("삭제되었습니다.");
    window.location.href = "recipe_main.html"; // 메인으로 이동
}

function handleScrap(recipe) {
    const bookmarkBtn = document.getElementById("recipeBookmark");
    bookmarkBtn.checked = (recipe.scrap === 1);

    bookmarkBtn.onclick = function(e) {
        const isChecked = e.target.checked;
        const newScrapStatus = isChecked ? 1 : 0; 

        const allRecipes = JSON.parse(localStorage.getItem("allRecipes"));
        const index = allRecipes.findIndex(r => r.id === recipe.id);
        
        if (index !== -1) {
            allRecipes[index].scrap = newScrapStatus;
            localStorage.setItem("allRecipes", JSON.stringify(allRecipes));
            recipe.scrap = newScrapStatus;
        }
    };
}

function renderReviews(recipe) {
    const container = document.getElementById("reviewListContainer");
    const countBadge = document.getElementById("reviewCountBadge");
    
    const reviewCount = recipe.reviewList ? recipe.reviewList.length : 0;
    countBadge.textContent = `(${reviewCount})`;

    if (!recipe.reviewList || recipe.reviewList.length === 0) {
        container.innerHTML = `<p style="padding:20px; color:#aaa;">아직 등록된 후기가 없어요. 첫 후기를 남겨주세요!</p>`;
        return;
    }

    const currentUser = localStorage.getItem('currentUser');
    
    const reviewsWithIndex = recipe.reviewList.map((review, index) => ({
        ...review,
        originalIndex: index // 원래 배열에서의 위치 저장
    }));

    const sortedReviews = reviewsWithIndex.reverse();

    container.innerHTML = sortedReviews.map(item => {
        let actionBtns = "";
        
        // 본인 댓글일 경우 수정/삭제 버튼 표시
        if (currentUser && item.user === currentUser) {
            actionBtns = `
                <button class="btn_modify" onclick="alert('댓글 수정은 준비중입니다.')" title="수정">
                    <img src="../../assets/images/modify.png" alt="수정">
                </button>
                <button class="btn_delete" onclick="deleteReview(${item.originalIndex})" title="삭제">
                    <img src="../../assets/images/delete.png" alt="삭제">
                </button>
            `;
        }

        return `
        <div class="review_item">
            <div class="review_user_row">
                <span class="review_user_id">${item.user}</span>
                <span class="review_date">${item.date} ${actionBtns}</span>
            </div>
            <div style="margin-bottom:5px;">
                <span class="review_stars">${"★".repeat(item.rating)}${"☆".repeat(5-item.rating)}</span>
            </div>
            <div class="review_text">${item.text}</div>
        </div>
        `;
    }).join('');
}

// ★ [추가됨] 댓글 삭제 함수 (전역 접근 가능해야 HTML onclick에서 호출됨)
window.deleteReview = function(index) {
    if(!confirm("이 후기를 삭제하시겠습니까?")) return;

    const allRecipes = JSON.parse(localStorage.getItem("allRecipes"));
    const recipeIndex = allRecipes.findIndex(r => r.id === currentRecipeId);
    
    if (recipeIndex !== -1) {
        const recipe = allRecipes[recipeIndex];
        
        // 해당 인덱스의 댓글 삭제
        recipe.reviewList.splice(index, 1);

        // 평점 및 개수 재계산
        recipe.reviews = recipe.reviewList.length;
        if (recipe.reviews > 0) {
            const sum = recipe.reviewList.reduce((acc, cur) => acc + cur.rating, 0);
            recipe.rating = (sum / recipe.reviews).toFixed(1);
        } else {
            recipe.rating = 0;
        }

        // 저장 및 화면 갱신
        localStorage.setItem("allRecipes", JSON.stringify(allRecipes));
        renderDetail(recipe); // 전체 다시 렌더링
    }
};

function submitReview() {

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert("로그인 후 이용해주세요.");
        return;
    }

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
        user: currentUser, 
        text: text,
        rating: currentRatingInput,
        date: new Date().toISOString().split('T')[0]
    };

    if (!recipe.reviewList) recipe.reviewList = [];
    recipe.reviewList.push(newReview);

    recipe.reviews = recipe.reviewList.length;
    const sum = recipe.reviewList.reduce((acc, cur) => acc + cur.rating, 0);
    recipe.rating = (sum / recipe.reviews).toFixed(1);

    allRecipes[recipeIndex] = recipe;
    localStorage.setItem("allRecipes", JSON.stringify(allRecipes));

    alert("후기가 등록되었습니다!");
    document.getElementById("reviewText").value = ""; 
    
    renderDetail(recipe);
}