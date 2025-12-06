// ============================================
// 저장된 식당 리스트
// ============================================

function loadSavedRestaurants() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return [];

    const allSaved = JSON.parse(localStorage.getItem("savedRestaurants_Map")) || {};
    return allSaved[currentUser] || [];
}

function saveSavedRestaurants(list) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    const allSaved = JSON.parse(localStorage.getItem("savedRestaurants_Map")) || {};
    allSaved[currentUser] = list;
    localStorage.setItem("savedRestaurants_Map", JSON.stringify(allSaved));
}

let savedRestaurants = loadSavedRestaurants();

// ============================================
// 지도 초기 설정
// ============================================
const map_container = document.getElementById("map");
const defaultPosition = new kakao.maps.LatLng(37.5665, 126.9780);
const defaultLevel = 5;

map_container.classList.add("fullscreen");

const map_option = {
    center: defaultPosition,
    level: defaultLevel
};

const map = new kakao.maps.Map(map_container, map_option);


// ============================================
// 레스토랑 데이터
// ============================================
let restaurant_list = [];
let currentRestaurantForReview = null;


// ============================================
// 전역 마커 & 오버레이
// ============================================
let markers = [];
let overlays = [];


// ============================================
// 체크박스, 검색, 지역 select
// ============================================
const checkboxes = document.querySelectorAll(".map_filter_item input[type='checkbox']");
const searchInput = document.querySelector(".map_search_box input");
const regionSelect = document.querySelector(".map_select select");


// ============================================
// 공유 팝업
// ============================================
const sharePopup = document.getElementById("share_popup");
const shareLinkInput = document.getElementById("share_link_input");
const shareCopyBtn = document.getElementById("share_copy_btn");
const shareCloseBtn = document.getElementById("share_close_btn");


// ============================================
// 저장한 식당 보기 버튼
// ============================================
const favButton = document.getElementById("fav_button");
let favActive = false;


// ============================================
// GPS 버튼
// ============================================
const gpsButton = document.getElementById("gps_button");

let gpsActive = false;
let userMarker = null;
let lastUserLatLng = null;

function toggleGPS() {
    gpsActive = !gpsActive;

    if (gpsActive) {
        gpsButton.src = "map_image/gps_act.png";

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    lastUserLatLng = new kakao.maps.LatLng(lat, lng);

                    if (userMarker) userMarker.setMap(null);

                    const userMarkerImage = new kakao.maps.MarkerImage(
                        "../../assets/images/map_pin.png",
                        new kakao.maps.Size(40, 40),
                        { offset: new kakao.maps.Point(20, 40) }
                    );

                    userMarker = new kakao.maps.Marker({
                        map: map,
                        position: lastUserLatLng,
                        image: userMarkerImage
                    });

                    map.setCenter(lastUserLatLng);
                    map.setLevel(defaultLevel);

                    setTimeout(() => {
                        if (gpsActive && lastUserLatLng) {
                            try { map.relayout(); } catch (e) { /* ignore */ }
                            map.setCenter(lastUserLatLng);
                        }
                    }, 50);
                },
                () => {
                    gpsActive = false;
                    gpsButton.src = "map_image/gps.png";
                    alert("위치 정보를 가져올 수 없습니다.");
                }
            );
        }
    } else {
        gpsButton.src = "map_image/gps.png";

        if (userMarker) userMarker.setMap(null);
    }
}

gpsButton.addEventListener("click", toggleGPS);


// ============================================
// 공유 팝업 열기
// ============================================
function openSharePopup(restaurant) {
    const lat = restaurant.marker_position.lat;
    const lng = restaurant.marker_position.lng;

    const finalShareLink =
        `https://map.naver.com/v5/search/${encodeURIComponent(restaurant.name)}/place/${lng},${lat}`;

    shareLinkInput.value = finalShareLink;
    sharePopup.style.display = "flex";

    shareCopyBtn.onclick = () => {
        navigator.clipboard.writeText(finalShareLink);
        alert("링크가 복사되었습니다.");
    };

    shareCloseBtn.onclick = () => {
        sharePopup.style.display = "none";
    };
}


// ============================================
// 식당 저장 버튼 상태
// ============================================
document.querySelector(".favorite_btn").onclick = () => {
    // 1. 로그인 체크
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert("로그인이 필요한 서비스입니다.");
        if(confirm("로그인 하시겠습니까?")) window.location.href = "../login/login.html";
        return;
    }

    // 2. 최신 데이터 불러오기 (중요: 다른 탭 등에서 변경되었을 수 있으므로)
    savedRestaurants = loadSavedRestaurants();

    if (savedRestaurants.includes(restaurant.id)) {
        savedRestaurants = savedRestaurants.filter(id => id !== restaurant.id);
        alert("저장이 취소되었습니다.");
    } else {
        savedRestaurants.push(restaurant.id);
        alert("식당이 저장되었습니다.");
    }

    // 3. 저장 및 아이콘 업데이트
    saveSavedRestaurants(savedRestaurants);
    updateIcon();

    if (savedRestaurants.length === 0 && favActive) {
        favActive = false;
        favButton.src = "map_image/fav.png";
        filterAndRenderMarkers(); 
    }
};

// ============================================
// 식당 저장 버튼 로직
// ============================================
function applyFavoriteButtonLogic(restaurant) {
    const btnDiv = document.querySelector(".favorite_btn");
    const btnImg = document.querySelector(".favorite_btn img");

    if (!btnDiv || !btnImg) {
        console.error("저장 버튼 요소를 찾을 수 없습니다.");
        return;
    }

    const currentId = Number(restaurant.id);

    function updateIcon() {
        const latestList = loadSavedRestaurants().map(id => Number(id)); // 저장된 것도 숫자로 변환
        
        if (latestList.includes(currentId)) {
            btnImg.src = "../../assets/images/map_favorite_act.png";
        } else {
            btnImg.src = "../../assets/images/map_favorite.png";
        }
    }

    updateIcon();

    btnDiv.onclick = function(e) {
        e.preventDefault();
        console.log("저장 버튼 클릭됨!");

        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            alert("로그인이 필요한 서비스입니다.");
            if(confirm("로그인 하시겠습니까?")) {
                 window.location.href = "../login/login.html";
            }
            return;
        }

        let mySavedList = loadSavedRestaurants().map(id => Number(id));

        if (mySavedList.includes(currentId)) {
            mySavedList = mySavedList.filter(id => id !== currentId);
            alert("저장이 취소되었습니다.");
        } else {
            mySavedList.push(currentId);
            alert("식당이 저장되었습니다.");
        }

        saveSavedRestaurants(mySavedList);
        updateIcon();

        if (typeof favActive !== 'undefined' && favActive) {
            if (mySavedList.length === 0) {
                favActive = false;
                const fb = document.getElementById("fav_button");
                if(fb) fb.src = "map_image/fav.png";
            }
            if (typeof filterAndRenderMarkers === 'function') {
                filterAndRenderMarkers();
            } else if (typeof showSavedMarkers === 'function') {
                showSavedMarkers();
            }
        }
    };
}

// ============================================
// 마커 클릭 시 포커스 + 카드
// ============================================
function focusMarker(restaurant) {
    map_container.classList.remove("fullscreen");
    map_container.classList.add("with_card");

    const cardContainer = document.querySelector(".map_card_outer_container");
    cardContainer.style.display = "block";

    update_restaurant_card(restaurant);

    currentRestaurantForReview = restaurant.id;

    renderCommunityReviews(restaurant.id);

    applyFavoriteButtonLogic(restaurant);

    cardContainer.scrollTop = 0;

    const position = new kakao.maps.LatLng(
        restaurant.marker_position.lat,
        restaurant.marker_position.lng
    );

    if (!gpsActive) {
        map.setLevel(2, { animate: true });
        try { map.relayout(); } catch (e) { /* ignore */ }
        map.setCenter(position);
    } else {
        try { map.relayout(); } catch (e) { /* ignore */ }
        if (lastUserLatLng) {
            setTimeout(() => {
                if (gpsActive && lastUserLatLng) {
                    map.setCenter(lastUserLatLng);
                }
            }, 50);
        }
    }

    document.getElementById("share_button").onclick = () => openSharePopup(restaurant);
}


// ============================================
// 카드 업데이트
// ============================================
function update_restaurant_card(restaurant) {
    document.querySelector(".map_card_info h3").textContent = restaurant.name;
    document.querySelector(".review_link").textContent = "리뷰 0";

    const tag_container = document.querySelector(".map_card_tag");
    tag_container.innerHTML = "";
    const tagClassMap = {
        "과일": "fruit",
        "채소": "veggie",
        "유제품": "milk",
        "달걀": "egg",
        "해산물": "fish",
        "가금류": "poultry",
        "육류": "meat"
    };
    if (restaurant.tags) {
        restaurant.tags.forEach(tag => {
            const span = document.createElement("span");
            span.className = "icon " + tagClassMap[tag];
            span.title = tag;
            tag_container.appendChild(span);
        });
    }

    document.querySelector("#tab_home_link .tab_info:nth-child(1) p").textContent = restaurant.address ?? "";
    document.querySelector("#tab_home_link .tab_info:nth-child(2) p").textContent = restaurant.hours ?? "";
    document.querySelector("#tab_home_link .tab_info:nth-child(3) p").textContent = restaurant.phone ?? "";
    document.querySelector("#tab_home_link .tab_info:nth-child(4) p").textContent = restaurant.info ?? "";

    const cardImage = document.querySelector(".map_card img");
    cardImage.src = (restaurant.restaurant_images && restaurant.restaurant_images.length > 0)
        ? restaurant.restaurant_images[0]
        : "";

    const menuTab = document.querySelector("#tab_menu_link");
    menuTab.innerHTML = "";
    if (restaurant.menu && restaurant.menu.length > 0) {
        restaurant.menu.forEach(menu => {
            const item = document.createElement("div");
            item.className = "map_menu_item";

            let html = `<div class="map_menu_info"><h4>${menu.name}</h4>`;

            if (menu.description) html += `<p>${menu.description}</p>`;

            if (menu.price !== undefined && menu.price !== null) {
                let p = "";
                p = isNaN(Number(menu.price))
                    ? menu.price
                    : `${Number(menu.price).toLocaleString()}원`;
                html += `<div class="map_menu_price">${p}</div>`;
            }

            html += `</div>`;

            if (menu.image) {
                html += `<div class="map_menu_image_container"><img src="${menu.image}" alt="${menu.name}" class="map_menu_image"></div>`;
            }

            item.innerHTML = html;
            menuTab.appendChild(item);
        });
    }

    const infoTab = document.querySelector("#tab_info_link .tab_info p");
    if (infoTab) {
        infoTab.innerHTML = restaurant.info_text
            ? restaurant.info_text.replace(/\n/g, "<br>")
            : "";
    }
}



// ============================================
// 즐겨찾기 모드 토글
// ============================================
function toggleFavoriteMode() {
    favActive = !favActive;

    if (favActive) {
        favButton.src = "map_image/fav_act.png";
        showSavedMarkers();
    } else {
        favButton.src = "map_image/fav.png";
    }
}

favButton.addEventListener("click", toggleFavoriteMode);


// ============================================
// 저장된 식당 마커 표시
// ============================================
function showSavedMarkers() {
    markers.forEach(m => m.setMap(null));
    overlays.forEach(o => o.setMap(null));
    markers = [];
    overlays = [];

    const savedData = restaurant_list.filter(r => savedRestaurants.includes(r.id));

    if (savedData.length === 0) {
        alert("저장한 식당이 없습니다.");
        favActive = false;
        favButton.src = "map_image/fav.png";
        return;
    }

    const bounds = new kakao.maps.LatLngBounds();

    savedData.forEach(r => {
        const pos = new kakao.maps.LatLng(r.marker_position.lat, r.marker_position.lng);

        const marker = new kakao.maps.Marker({
            map: map,
            position: pos
        });

        const overlay = new kakao.maps.CustomOverlay({
            map: map,
            position: pos,
            content: '<div class="map_pin"></div>',
            yAnchor: 1
        });

        kakao.maps.event.addListener(marker, "click", () => focusMarker(r));
        kakao.maps.event.addListener(overlay, () => focusMarker(r));

        markers.push(marker);
        overlays.push(overlay);

        bounds.extend(pos);
    });

    if (!gpsActive && !bounds.isEmpty()) {
        map.setBounds(bounds);
    } else {
        if (gpsActive && lastUserLatLng) {
            setTimeout(() => {
                if (gpsActive && lastUserLatLng) {
                    try { map.relayout(); } catch (e) { /* ignore */ }
                    map.setCenter(lastUserLatLng);
                }
            }, 50);
        }
    }
}


// ============================================
// 필터 + 마커 렌더링
// ============================================
function filterAndRenderMarkers() {
    const selectedTags = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.nextElementSibling.textContent);

    const searchText = searchInput.value.trim();
    const selectedRegion = regionSelect.value;

    let targetList = favActive
        ? restaurant_list.filter(r => savedRestaurants.includes(r.id))
        : restaurant_list;

    markers.forEach(m => m.setMap(null));
    overlays.forEach(o => o.setMap(null));
    markers = [];
    overlays = [];

    const filtered = targetList.filter(r => {
        const matchTag =
            selectedTags.length === 0 ||
            (r.tags && selectedTags.every(tag => r.tags.includes(tag)));

        const matchSearch =
            searchText === "" ||
            (r.name && r.name.includes(searchText)) ||
            (r.address && r.address.includes(searchText));

        const matchRegion =
            selectedRegion === "지역 선택" || r.region === selectedRegion;

        return matchTag && matchSearch && matchRegion;
    });

    const noFilter =
        selectedTags.length === 0 &&
        searchText === "" &&
        (selectedRegion === "지역 선택" || !selectedRegion);

    if (noFilter) {
        if (favActive) {
            showSavedMarkers();
        }
        return;
    }

    const bounds = new kakao.maps.LatLngBounds();

    filtered.forEach(r => {
        if (!r.marker_position) return;

        const pos = new kakao.maps.LatLng(r.marker_position.lat, r.marker_position.lng);

        const marker = new kakao.maps.Marker({ map, position: pos });

        const overlay = new kakao.maps.CustomOverlay({
            map,
            position: pos,
            content: '<div class="map_pin"></div>',
            yAnchor: 1
        });

        kakao.maps.event.addListener(marker, "click", () => focusMarker(r));
        kakao.maps.event.addListener(overlay, () => focusMarker(r));

        markers.push(marker);
        overlays.push(overlay);

        bounds.extend(pos);
    });

    if (!gpsActive && !bounds.isEmpty()) {
        map.setBounds(bounds);
    } else if (gpsActive && lastUserLatLng) {
        setTimeout(() => {
            if (gpsActive && lastUserLatLng) {
                try { map.relayout(); } catch (e) { /* ignore */ }
                map.setCenter(lastUserLatLng);
            }
        }, 50);
    }
}


// ============================================
// JSON 로드
// ============================================
fetch("restaurant_data.json")
    .then(res => res.json())
    .then(data => {
        restaurant_list = data;

        checkboxes.forEach(cb => cb.addEventListener("change", filterAndRenderMarkers));
        searchInput.addEventListener("input", filterAndRenderMarkers);
        regionSelect.addEventListener("change", filterAndRenderMarkers);

        regionSelect.addEventListener("change", () => {
            if (!gpsActive && regionSelect.value === "지역 선택") {
                map.setLevel(13);
                map.setCenter(new kakao.maps.LatLng(36.5, 127.8));
            }
        });

        const closeBtn = document.querySelector(".map_card_close_btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", closeRestaurantCard);
        }
    })
    .catch(err => console.error("restaurant_data.json 불러오기 실패:", err));


// ============================================
// 페이지 최초 위치 설정
// ============================================
let initialPositionSet = false;

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            if (!initialPositionSet) {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                const userPos = new kakao.maps.LatLng(lat, lng);

                map.setCenter(userPos);
                map.setLevel(defaultLevel);

                lastUserLatLng = userPos;
                initialPositionSet = true;
            }
        },
        () => {
            if (!initialPositionSet) {
                map.setCenter(defaultPosition);
                map.setLevel(defaultLevel);
                initialPositionSet = true;
            }
        }
    );
} else {
    map.setCenter(defaultPosition);
    map.setLevel(defaultLevel);
    initialPositionSet = true;
}


// ============================================
// 카드 닫기
// ============================================
function closeRestaurantCard() {
    const cardContainer = document.querySelector(".map_card_outer_container");

    cardContainer.style.display = "none";

    map_container.classList.remove("with_card");
    map_container.classList.add("fullscreen");

    if (!gpsActive) {
        const currentCenter = map.getCenter();

        setTimeout(() => {
            map.relayout();
            map.setCenter(currentCenter);
        }, 50);
    } else {
        if (lastUserLatLng) {
            setTimeout(() => {
                try { map.relayout(); } catch (e) { /* ignore */ }
                if (gpsActive && lastUserLatLng) {
                    map.setCenter(lastUserLatLng);
                }
            }, 50);
        }
    }
}


// ============================================
//  community 후기 렌더링
// ============================================
function renderCommunityReviews(restaurantId) {
    const reviewArea = document.getElementById("tab_review_link");
    if (!reviewArea) return;

    let writeBtn = document.getElementById("map_review_write_btn");
    const hadExistingButton = !!writeBtn;

    if (!writeBtn) {
        writeBtn = document.createElement("button");
        writeBtn.id = "map_review_write_btn";
        writeBtn.className = "map_review_write_btn";
        writeBtn.textContent = "리뷰 작성";
    }

    reviewArea.innerHTML = "";
    reviewArea.appendChild(writeBtn);

    writeBtn.onclick = () => {
        // 1. 로그인 체크 추가
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            alert("로그인이 필요한 서비스입니다.");
            if(confirm("로그인 하시겠습니까?")) window.location.href = "../login/login.html";
            return;
        }

        if (!currentRestaurantForReview) {
            alert("먼저 지도에서 식당을 선택해주세요.");
            return;
        }

        const url = new URL("../community/community.html", window.location.href);
        url.searchParams.set("mode", "write");
        url.searchParams.set("restaurantId", currentRestaurantForReview);
        url.searchParams.set("fromMap", "1");
        window.location.href = url.toString();
    };

    const posts = JSON.parse(localStorage.getItem("community_posts")) || [];

    const reviews = posts.filter(
        p => p.category === "review" && p.restaurantId === restaurantId
    );

    const reviewLink = document.querySelector(".review_link");
    if (reviewLink) {
        reviewLink.textContent = `리뷰 ${reviews.length}`;
    }

    if (reviews.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.style.padding = "10px";
        emptyMsg.style.color = "#777";
        emptyMsg.textContent = "등록된 후기가 없습니다.";
        reviewArea.appendChild(emptyMsg);
        return;
    }

    reviews.forEach(r => {
        const imageUrl = r.imageData || r.image || "";

        const div = document.createElement("div");
        div.className = "map_review_item";
        div.style.cursor = "pointer";

        div.innerHTML = `
            <div class="map_review">
                <div class="map_review_user_info">
                    <img src="${r.authorImage}" class="map_user_image">
                    <h4>${r.authorName}</h4>
                </div>

                ${imageUrl ? `
                    <div class="map_review_image_container">
                        <img src="${imageUrl}" class="map_review_image">
                    </div>
                ` : ""}

                <p>${r.text}</p>
            </div>
        `;

        div.addEventListener("click", () => {
            window.location.href = `../community/community_post_wide.html?id=${r.postId}`;
        });

        reviewArea.appendChild(div);
    });
}

// ============================================
// 리뷰 버튼 클릭 시 항상 리뷰 탭 열기
// ============================================
document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("review_link")) return;
    e.preventDefault();

    const reviewRadio = document.getElementById("tab_review");
    reviewRadio.checked = true;

    const tabContainer = document.querySelector(".map_tab_card");
    tabContainer.scrollTop = 0;

    const cardOuter = document.querySelector(".map_card_outer_container");
    const reviewPanel = document.getElementById("tab_review_link");

    if (cardOuter && reviewPanel) {
        const offsetTop = reviewPanel.offsetTop;
        cardOuter.scrollTo({
            top: offsetTop,
            behavior: "smooth"
        });
    }
});

// ============================================
// 탭 클릭 → 해당 패널로 스크롤
// ============================================

const tabMap = {
    "label[for='tab_home']":   { radio: "tab_home",   panel: "tab_home_link" },
    "label[for='tab_menu']":   { radio: "tab_menu",   panel: "tab_menu_link" },
    "label[for='tab_review']": { radio: "tab_review", panel: "tab_review_link" },
    "label[for='tab_photo']":  { radio: "tab_photo",  panel: "tab_image_link" },
    "label[for='tab_info']":   { radio: "tab_info",   panel: "tab_info_link" }
};

document.addEventListener("click", (e) => {
    const entry = Object.entries(tabMap).find(([selector]) =>
        e.target.closest(selector)
    );
    if (!entry) return;

    e.preventDefault();

    const [, { radio, panel }] = entry;

    const radioInput = document.getElementById(radio);
    if (radioInput) radioInput.checked = true;

    const cardOuter = document.querySelector(".map_card_outer_container");
    const panelElem = document.getElementById(panel);

    if (cardOuter && panelElem) {
        cardOuter.scrollTo({
            top: panelElem.offsetTop,
            behavior: "smooth"
        });
    }
});
