/* 전역 변수 */
let hashtags = [];

// 자동 생성될 수 있는 모든 태그 목록 (중복 방지 및 갱신용 사전)
const AUTO_TAG_DICT = [
    // 1. 채식 단계
    "#비건", "#락토", "#오보", "#락토오보", "#페스코", "#폴로", "#플렉시테리언",
    // 2. 카테고리
    "#한식", "#양식", "#베이킹", "#디저트", "#기타",
    // 3. 재료 아이콘
    "#채소", "#과일", "#유제품", "#달걀", "#해산물", "#가금류", "#육류"
];

// 한글 매핑용 객체
const CAT_MAP = {
    "korean": "#한식", "western": "#양식", "baking": "#베이킹", "dessert": "#디저트", "etc": "#기타"
};
const ICON_MAP = {
    "veggie": "#채소", "fruit": "#과일", "milk": "#유제품", "egg": "#달걀",
    "fish": "#해산물", "poultry": "#가금류", "meat": "#육류"
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. 초기 폼 세팅
    addIngRow('ing_main_list');
    addIngRow('ing_season_list');
    addStep();

    // 2. 이벤트 리스너: 아이콘(체크박스) 변경 시 태그 갱신
    document.querySelectorAll('input[name="icons"]').forEach(cb => {
        cb.addEventListener('change', updateAutoHashtags);
    });

    // 3. 이벤트 리스너: 카테고리(라디오) 변경 시 태그 갱신
    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', updateAutoHashtags);
    });

    // 4. 페이지 로드 시 초기 상태로 태그 생성
    updateAutoHashtags();

    // 5. 해시태그 수동 입력 로직
    const tagInput = document.getElementById("tag_input");
    tagInput.addEventListener("keydown", function(e) {
        if (e.isComposing) return; // 한글 중복 입력 방지

        if (e.key === "Enter" || e.code === "Space") {
            e.preventDefault();
            const val = this.value.trim();
            // 자동 태그 목록에 없는 새로운 태그만 추가 가능
            if (val && !hashtags.includes("#" + val)) {
                const newTag = val.startsWith("#") ? val : "#" + val;
                // 이미 있는 자동 태그인지 확인 (중복 방지)
                if(!AUTO_TAG_DICT.includes(newTag)) {
                    hashtags.push(newTag);
                    renderHashtags();
                }
                this.value = "";
            }
        }
    });
});

/* ★ 핵심 기능: 모든 자동 해시태그 통합 관리 함수 */
function updateAutoHashtags() {
    const checkedIcons = Array.from(document.querySelectorAll('input[name="icons"]:checked')).map(cb => cb.value);
    const selectedCategory = document.querySelector('input[name="category"]:checked').value;

    let newAutoTags = [];

    
    checkedIcons.forEach(icon => {
        if (ICON_MAP[icon]) {
            newAutoTags.push(ICON_MAP[icon]);
        }
    });

    let levelTag = "#비건";
    if (checkedIcons.includes("meat")) levelTag = "#플렉시테리언";
    else if (checkedIcons.includes("poultry")) levelTag = "#폴로";
    else if (checkedIcons.includes("fish")) levelTag = "#페스코";
    else if (checkedIcons.includes("egg") && checkedIcons.includes("milk")) levelTag = "#락토오보";
    else if (checkedIcons.includes("egg")) levelTag = "#오보";
    else if (checkedIcons.includes("milk")) levelTag = "#락토";
    
    newAutoTags.push(levelTag);

    if (CAT_MAP[selectedCategory]) {
        newAutoTags.push(CAT_MAP[selectedCategory]);
    }

    const manualTags = hashtags.filter(tag => !AUTO_TAG_DICT.includes(tag));

    hashtags = [...newAutoTags, ...manualTags];

    renderHashtags();
}


/* 이미지 미리보기 */
function previewMainImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const label = document.getElementById("mainImagePreview");
            label.style.backgroundImage = `url(${e.target.result})`;
            label.innerHTML = "";
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function previewStepImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const label = input.nextElementSibling;
            const img = label.nextElementSibling;
            
            img.src = e.target.result;
            img.style.display = "block";
            label.style.display = "none";
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/* 동적 요소 추가 */
function addIngRow(containerId) {
    const container = document.getElementById(containerId);
    const div = document.createElement("div");
    div.className = "ing_row";
    div.innerHTML = `
        <div class="input_box_wrapper" style="flex:2">
            <input type="text" class="form_input ing_name" placeholder="재료명">
        </div>
        <div class="input_box_wrapper" style="flex:1">
            <input type="text" class="form_input ing_amount" placeholder="양">
        </div>
        <button type="button" class="btn_delete_mini" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

function addStep() {
    const container = document.getElementById("step_container");
    const count = container.children.length + 1;
    const div = document.createElement("div");
    div.className = "step_item";

    div.innerHTML = `
        <div class="step_header">
            Step ${count} <button type="button" class="btn_delete_mini" onclick="removeStep(this)">삭제</button>
        </div>
        <div class="step_content">
            <div>
                <input type="file" class="step_file" accept="image/*" style="display:none;" id="step_file_${count}" onchange="previewStepImage(this)">
                <label for="step_file_${count}" class="step_upload_label">📷</label>
                <img class="step_preview_img">
            </div>
            <div class="input_box_wrapper" style="width:100%; height:120px; align-items:flex-start;">
                <textarea class="form_input step_text" placeholder="과정을 설명해주세요." style="height:100%;"></textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function removeStep(btn) {
    btn.parentElement.parentElement.remove();
    const steps = document.querySelectorAll("#step_container .step_item");
    steps.forEach((item, i) => {
         item.querySelector(".step_header").childNodes[0].textContent = `Step ${i + 1} `;
    });
}

/* 해시태그 렌더링 */
function renderHashtags() {
    const container = document.getElementById("hashtag_container");
    const existingTags = container.querySelectorAll(".hashtag");
    existingTags.forEach(el => el.remove());
    
    hashtags.forEach((tag, idx) => {
        const span = document.createElement("span");
        span.className = "hashtag"; 
        span.style.cursor = "default"; 
        
        // 자동 생성된 태그인지 확인
        const isAuto = AUTO_TAG_DICT.includes(tag);

        if (isAuto) {
            span.innerHTML = `${tag}`;
            span.style.backgroundColor = "#e8f5e9";
            span.style.borderColor = "#c8e6c9";
        } else {
            span.innerHTML = `${tag} <span class="tag_close_btn" style="margin-left:5px; cursor:pointer;">×</span>`;
            // 수동 태그만 삭제 이벤트 연결
            span.querySelector(".tag_close_btn").addEventListener("click", function(e) {
                 e.stopPropagation();
                 hashtags.splice(idx, 1);
                 renderHashtags();
            });
        }

        const input = document.getElementById("tag_input");
        container.insertBefore(span, input);
    });
}

/* 파일 읽기 헬퍼 */
function readFileAsync(file) {
    return new Promise((resolve) => {
        if (!file) resolve("");
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

/* Submit 로직 */
document.getElementById("recipeForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const title = document.getElementById("title").value;
    const mainFile = document.getElementById("imageFile").files[0];
    
    if(!title || !mainFile) { alert("제목과 대표 이미지는 필수입니다!"); return; }

    const mainImg = await readFileAsync(mainFile);

    const ingredientGroups = [];
    
    // 주재료
    const mainItems = [];
    document.querySelectorAll("#ing_main_list .ing_row").forEach(row => {
        const n = row.querySelector(".ing_name").value;
        const a = row.querySelector(".ing_amount").value;
        if(n) mainItems.push({ name: n, amount: a });
    });
    if(mainItems.length > 0) ingredientGroups.push({ category: "주재료", items: mainItems });

    // 양념
    const seasonItems = [];
    document.querySelectorAll("#ing_season_list .ing_row").forEach(row => {
        const n = row.querySelector(".ing_name").value;
        const a = row.querySelector(".ing_amount").value;
        if(n) seasonItems.push({ name: n, amount: a });
    });
    if(seasonItems.length > 0) ingredientGroups.push({ category: "양념", items: seasonItems });

    const steps = [];
    const stepDivs = document.querySelectorAll(".step_item");
    for(const div of stepDivs) {
        const file = div.querySelector(".step_file").files[0];
        const desc = div.querySelector(".step_text").value;
        
        let img = "";
        if (file) {
            img = await readFileAsync(file);
        }
        steps.push({ img: img, desc: desc });
    }

    const icons = [];
    document.querySelectorAll('input[name="icons"]:checked').forEach(cb => icons.push(cb.value));
    
    const allRecipes = JSON.parse(localStorage.getItem("allRecipes")) || [];
    const newId = allRecipes.length > 0 ? Math.max(...allRecipes.map(r => r.id)) + 1 : 1;

    const today = new Date().toISOString().split('T')[0];
    
    // 현재 로그인 기능이 없으므로 임의의 작성자 ID 부여
    const currentUser = "user" + Math.floor(Math.random() * 100); 

    const newRecipe = {
        id: newId,
        title: title,
        author: currentUser, // ★ 작성자 정보 추가
        date: today,
        description: document.getElementById("description").value,
        image: mainImg,
        category: document.querySelector('input[name="category"]:checked').value,
        servings: document.querySelector('input[name="servings"]:checked').value,
        time: document.querySelector('input[name="time"]:checked').value,
        difficulty: document.querySelector('input[name="difficulty"]:checked').value,
        rating: 0, 
        reviews: 0,
        reviewList: [], // ★ 빈 후기 리스트 초기화
        icons: icons,
        ingredients: ["veg"], 
        hashtags: hashtags,
        ingredientGroups: ingredientGroups,
        steps: steps
    };

    allRecipes.unshift(newRecipe);
    localStorage.setItem("allRecipes", JSON.stringify(allRecipes));
    
    alert("레시피가 등록되었습니다!");
    window.location.href = "recipe_main.html";
});