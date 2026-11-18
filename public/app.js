const input = document.getElementById("url");
const button = document.getElementById("check");
const result = document.getElementById("result");

// Create format selection options dynamically inside the panel
const panel = document.querySelector(".panel");
let formatSelector = document.getElementById("format-select");
if (!formatSelector) {
  const div = document.createElement("div");
  div.style.cssText = "margin: 12px 0; display: flex; gap: 10px; align-items: center;";
  div.innerHTML = `
    <label for="format-select" style="font-size: 11px; color: #8ebde8; font-weight: 800; margin:0;">FORMAT / QUALITY:</label>
    <select id="format-select" style="flex:1; background:#080f1d; border:1px solid #293c57; border-radius:8px; padding:10px; color:white; font-size:13px; outline:none;">
      <option value="720">HD Video (720p/1080p)</option>
      <option value="480">SD Video (480p)</option>
      <option value="mp3">Audio (MP3)</option>
      <option value="wav">High Quality Audio (WAV)</option>
    </select>
  `;
  panel.insertBefore(div, result);
}

button.addEventListener("click", async () => {
  const selectedFormat = document.getElementById("format-select").value;
  button.disabled = true; 
  button.textContent = "PROCESSING...";
  result.innerHTML = "Fetching direct download link...";
  
  try {
    const response = await fetch("/api/inspect", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.value, format: selectedFormat })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not process this link.");
    
    // Direct download trigger without viewing video
    result.innerHTML = `
      <div style="margin-top: 10px; background: #080f1d; padding: 14px; border-radius: 10px; border: 1px solid #293c57; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #fff; font-weight: bold; font-size: 14px;">${data.title || 'Media File'}</p>
        <a href="${data.url}" id="auto-dl" style="display: block; background: linear-gradient(100deg,#239eea,#625eff); color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
          ⬇ DOWNLOAD NOW (DIRECT FILE)
        </a>
      </div>
    `;

    // Automatically trigger download instantly
    const downloadLink = document.getElementById("auto-dl");
    if (downloadLink) {
      const a = document.createElement('a');
      a.href = data.url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

  } catch (error) { 
    result.textContent = error.message; 
  } finally { 
    button.disabled = false; 
    button.innerHTML = 'CHECK LINK <span>↗</span>'; 
  }
});

input.addEventListener("keydown", e => { if (e.key === "Enter") button.click(); });
