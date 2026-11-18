const input = document.getElementById("url");
const button = document.getElementById("check");
const result = document.getElementById("result");
button.addEventListener("click", async () => {
  button.disabled = true; button.textContent = "CHECKING...";
  result.textContent = "Checking link...";
  try {
    const response = await fetch("/api/inspect", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({url: input.value})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not check this link.");
    result.textContent = data.message;
  } catch (error) { result.textContent = error.message; }
  finally { button.disabled = false; button.innerHTML = 'CHECK LINK <span>↗</span>'; }
});
input.addEventListener("keydown", e => { if (e.key === "Enter") button.click(); });
