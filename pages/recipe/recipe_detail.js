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
    
    const authorName = recipe.author || "익명";
    document.getElementById("recipeAuthor").textContent = authorName;
    
    const authorContainer = document.querySelector(".author_info");
    
    const oldModBtn = document.getElementById("btnRecipeModify");
    const oldDelBtn = document.getElementById("btnRecipeDelete");
    if(oldModBtn) oldModBtn.remove();
    if(oldDelBtn) oldDelBtn.remove();

    const currentUser = localStorage.getItem('currentUser');

    if (currentUser && recipe.author === currentUser) {
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

function deleteRecipe(id) {
    const currentUser = localStorage.getItem('currentUser');
    let allRecipes = JSON.parse(localStorage.getItem("allRecipes"));
    
    const targetRecipe = allRecipes.find(r => r.id === id);
    
    if (!targetRecipe) return;

    if (targetRecipe.author !== currentUser) {
        alert("삭제 권한이 없습니다.");
        return;
    }

    const newRecipes = allRecipes.filter(r => r.id !== id);
    
    localStorage.setItem("allRecipes", JSON.stringify(newRecipes));
    alert("삭제되었습니다.");
    window.location.href = "recipe_main.html"; 
}

function handleScrap(recipe) {
    const bookmarkBtn = document.getElementById("recipeBookmark");
    const currentUser = localStorage.getItem('currentUser');

    // 1. 화면 로드 시 초기 상태 확인 (기존과 동일)
    let scrapData = JSON.parse(localStorage.getItem('scrappedRecipes')) || {};
    let myScraps = scrapData[currentUser] || [];
    
    // 내 스크랩 목록에 현재 레시피 ID가 있으면 체크된 상태로 시작
    bookmarkBtn.checked = myScraps.includes(recipe.id);

    // 2. 클릭 이벤트 리스너 수정
    bookmarkBtn.onclick = function(e) {
        // (1) 로그인을 안 했다면? -> 클릭을 막고(preventDefault) 경고창 띄움
        if (!currentUser) {
            e.preventDefault(); // 체크박스가 변하지 않게 막음
            alert("로그인 후 이용 가능합니다.");
            if(confirm("로그인 하시겠습니까?")) {
                 window.location.href = "../login/login.html";
            }
            return;
        }

        // (2) 로그인을 했다면? -> e.preventDefault()를 쓰지 않음!
        // 브라우저가 알아서 체크박스를 V 표시하거나 해제하도록 놔둡니다.
        // 우리는 바뀐 결과(checked 여부)만 확인해서 저장하면 됩니다.

        const isNowChecked = bookmarkBtn.checked; // 클릭 후의 상태

        // 최신 데이터 다시 로드
        scrapData = JSON.parse(localStorage.getItem('scrappedRecipes')) || {};
        myScraps = scrapData[currentUser] || [];

        if (isNowChecked) {
            // 체크됨 -> 목록에 추가
            if (!myScraps.includes(recipe.id)) {
                myScraps.push(recipe.id);
            }
            
            setTimeout(() => alert("나의 레시피(스크랩)에 저장되었습니다."), 10);
            
        } else {
            myScraps = myScraps.filter(id => id !== recipe.id);
            setTimeout(() => alert("스크랩이 취소되었습니다."), 10);
        }

        scrapData[currentUser] = myScraps;
        localStorage.setItem('scrappedRecipes', JSON.stringify(scrapData));
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
        originalIndex: index
    }));

    const sortedReviews = reviewsWithIndex.reverse();

    container.innerHTML = sortedReviews.map(item => {
        let actionBtns = "";
        
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

window.deleteReview = function(index) {
    if(!confirm("이 후기를 삭제하시겠습니까?")) return;

    const allRecipes = JSON.parse(localStorage.getItem("allRecipes"));
    const recipeIndex = allRecipes.findIndex(r => r.id === currentRecipeId);
    
    if (recipeIndex !== -1) {
        const recipe = allRecipes[recipeIndex];
        
        recipe.reviewList.splice(index, 1);

        recipe.reviews = recipe.reviewList.length;
        if (recipe.reviews > 0) {
            const sum = recipe.reviewList.reduce((acc, cur) => acc + cur.rating, 0);
            recipe.rating = (sum / recipe.reviews).toFixed(1);
        } else {
            recipe.rating = 0;
        }

        localStorage.setItem("allRecipes", JSON.stringify(allRecipes));
        renderDetail(recipe);
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