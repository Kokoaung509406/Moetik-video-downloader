const input = document.getElementById("url");
const button = document.getElementById("check");
const result = document.getElementById("result");

const panel = document.querySelector(".panel");
if (panel && !document.getElementById("mode-select")) {
  const div = document.createElement("div");
  div.style.cssText = "margin: 12px 0; display: flex; gap: 10px; align-items: center;";
  div.innerHTML = `
    <label for="mode-select" style="font-size: 11px; color: #8ebde8; font-weight: 800; margin:0;">MODE:</label>
    <select id="mode-select" style="flex:1; background:#080f1d; border:1px solid #293c57; border-radius:8px; padding:10px; color:white; font-size:13px; outline:none;">
      <option value="hd">Video HD (No Watermark)</option>
      <option value="sd">Video SD</option>
      <option value="audio">Audio Only (MP3)</option>
    </select>
  `;
  panel.insertBefore(div, result);
}

function triggerDirectDownload(downloadUrl) {
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.setAttribute("download", "");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

button.addEventListener("click", async () => {
  const mode = document.getElementById("mode-select")?.value || "hd";
  button.disabled = true;
  button.textContent = "DOWNLOADING...";
  result.textContent = "Preparing direct file download...";

  try {
    const response = await fetch("/api/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.value, mode })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Download failed.");

    const directUrl = `/api/download?url=${encodeURIComponent(data.url)}&ext=${encodeURIComponent(data.ext || "mp4")}`;

    result.innerHTML = `
      <div style="margin-top: 10px; background: #080f1d; padding: 12px; border-radius: 10px; border: 1px solid #293c57; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #fff; font-weight: bold; font-size: 13px;">${data.title || "Direct File"}</p>
        <a href="${directUrl}" style="display: block; background: linear-gradient(100deg,#239eea,#625eff); color: white; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
          ⬇ SAVE FILE DIRECTLY
        </a>
      </div>
    `;

    triggerDirectDownload(directUrl);
  } catch (error) {
    result.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = "CHECK LINK <span>↗</span>";
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") button.click();
});
