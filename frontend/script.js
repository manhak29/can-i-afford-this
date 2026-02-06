document.getElementById("loginBtn").addEventListener("click", () => {
  fetch("/login", {
    method: "POST"
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      window.location.href = "welcome.html";
    }
  });
});
