document.addEventListener("DOMContentLoaded", () => {
    const settingsItems = document.querySelectorAll(".settings_item");

    settingsItems.forEach((item) => {
        item.addEventListener("click", function () {
            const label = this.querySelector(".settings_label").textContent;

            if (label === "비밀번호 변경") {
                // 비밀번호 변경 기능
            } else if (label === "회원탈퇴") {
                // 회원탈퇴 기능
            }
        });
    });
});
