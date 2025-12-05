// ============================================
// 지도 초기 설정
// ============================================
const map_container = document.getElementById("map");
const defaultPosition = new kakao.maps.LatLng(37.5665, 126.9780);
const defaultLevel = 5;

// 초기 로드 시 지도 전체 화면
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

// ============================================
// 전역 마커 & 오버레이
// ============================================
let markers = [];
let overlays = [];

// ============================================
// 체크박스, 검색어, 지역 select
// ============================================
const checkboxes = document.querySelectorAll(".map_filter_item input[type='checkbox']");
const searchInput = document.querySelector(".map_search_box input");
const regionSelect = document.querySelector(".map_select select");

// ============================================
// 공유 팝업 요소
// ============================================
const sharePopup = document.getElementById("share_popup");
const shareLinkInput = document.getElementById("share_link_input");
const shareCopyBtn = document.getElementById("share_copy_btn");
const shareCloseBtn = document.getElementById("share_close_btn");

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
        // 클릭하면 활성화 이미지로 변경
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
                },
                () => {
                    gpsActive = false;
                    gpsButton.src = "map_image/gps.png";
                    alert("위치 정보를 가져올 수 없습니다.");
                }
            );
        }
    } else {
        // 비활성 이미지로 변경
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
// 마커 클릭 시 화면 중앙 + 카드 표시
// ============================================
function focusMarker(restaurant) {
    map_container.classList.remove("fullscreen");
    map_container.classList.add("with_card");

    const cardContainer = document.querySelector(".map_card_outer_container");
    cardContainer.style.display = "block";

    update_restaurant_card(restaurant);

    cardContainer.scrollTop = 0;

    const position = new kakao.maps.LatLng(
        restaurant.marker_position.lat,
        restaurant.marker_position.lng
    );

    map.setLevel(2, { animate: true });
    map.relayout();
    map.setCenter(position);

    const shareBtn = document.getElementById("share_button");
    shareBtn.onclick = () => openSharePopup(restaurant);
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
    cardImage.src = restaurant.restaurant_images && restaurant.restaurant_images.length > 0
        ? restaurant.restaurant_images[0]
        : "";

    const menuTab = document.querySelector("#tab_menu_link");
    menuTab.innerHTML = "";
    if (restaurant.menu && restaurant.menu.length > 0) {
        restaurant.menu.forEach(menu => {
            const item = document.createElement("div");
            item.className = "map_menu_item";

            let menuHTML = `<div class="map_menu_info">
                                <h4>${menu.name}</h4>`;

            if (menu.description) menuHTML += `<p>${menu.description}</p>`;

            if (menu.price !== undefined && menu.price !== null) {
                let priceHTML = "";

                if (!isNaN(Number(menu.price))) {
                    priceHTML = `${Number(menu.price).toLocaleString()}원`;
                } else {
                    priceHTML = menu.price;
                }

                menuHTML += `<div class="map_menu_price">${priceHTML}</div>`;
            }

            menuHTML += `</div>`;

            if (menu.image) {
                menuHTML += `<div class="map_menu_image_container">
                                <img src="${menu.image}" alt="${menu.name}" class="map_menu_image">
                            </div>`;
            }

            item.innerHTML = menuHTML;
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
// 필터링 + 마커 렌더링
// ============================================
function filterAndRenderMarkers() {
    const selectedTags = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.nextElementSibling.textContent);

    const searchText = searchInput.value.trim();
    const selectedRegion = regionSelect.value;

    markers.forEach(marker => marker.setMap(null));
    overlays.forEach(overlay => overlay.setMap(null));
    markers = [];
    overlays = [];

    const filteredRestaurants = restaurant_list.filter(r => {
        const matchTag =
            selectedTags.length === 0 ||
            selectedTags.every(tag => r.tags.includes(tag));

        const matchSearch =
            searchText === "" ||
            r.name.includes(searchText) ||
            r.address.includes(searchText);

        const matchRegion =
            selectedRegion === "지역 선택" || r.region === selectedRegion;

        return matchTag && matchSearch && matchRegion;
    });

    const noFilterApplied =
        selectedTags.length === 0 &&
        searchText === "" &&
        (selectedRegion === "지역 선택" || !selectedRegion);

    if (noFilterApplied) return;

    const bounds = new kakao.maps.LatLngBounds();

    filteredRestaurants.forEach(restaurant => {
        if (!restaurant.marker_position) return;

        const position = new kakao.maps.LatLng(
            restaurant.marker_position.lat,
            restaurant.marker_position.lng
        );

        const marker = new kakao.maps.Marker({
            map: map,
            position: position
        });

        const overlay = new kakao.maps.CustomOverlay({
            position: position,
            content: '<div class="map_pin"></div>',
            yAnchor: 1
        });
        overlay.setMap(map);

        kakao.maps.event.addListener(marker, "click", () => focusMarker(restaurant));
        kakao.maps.event.addListener(overlay, "click", () => focusMarker(restaurant));

        markers.push(marker);
        overlays.push(overlay);

        bounds.extend(position);
    });

    if (!bounds.isEmpty()) {
        map.setBounds(bounds);
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
            if (regionSelect.value === "지역 선택") {
                map.setLevel(13); 
                map.setCenter(new kakao.maps.LatLng(36.5, 127.8));
            }
        });
    })
    .catch(err => console.error("restaurant_data.json 불러오기 실패:", err));


// ============================================
// 페이지 최초 로드 시 위치
// ============================================
let initialPositionSet = false;

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            if (!initialPositionSet) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                const userPosition = new kakao.maps.LatLng(userLat, userLng);

                // 지도만 이동 (마커 X)
                map.setCenter(userPosition);
                map.setLevel(defaultLevel);

                lastUserLatLng = userPosition;

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
