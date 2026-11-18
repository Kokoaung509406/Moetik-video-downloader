const input = document.getElementById("url");
const button = document.getElementById("check");
const result = document.getElementById("result");

button.addEventListener("click", async () => {
  button.disabled = true; 
  button.textContent = "CHECKING...";
  result.innerHTML = "Checking link and fetching no-watermark video...";
  
  try {
    const response = await fetch("/api/inspect", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.value })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not check this link.");
    
    // Display result with direct download button
    result.innerHTML = `
      <div style="margin-top: 10px; background: #080f1d; padding: 12px; border-radius: 10px; border: 1px solid #293c57;">
        <p style="margin: 0 0 8px 0; color: #fff; font-weight: bold;">${data.title || 'Video'}</p>
        ${data.thumbnail ? `<img src="${data.thumbnail}" alt="Thumbnail" style="width: 100%; max-height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
        <a href="${data.url}" target="_blank" download style="display: block; text-align: center; background: linear-gradient(100deg,#239eea,#625eff); color: white; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
          DOWNLOAD NO-WATERMARK VIDEO ↗
        </a>
      </div>
    `;
  } catch (error) { 
    result.textContent = error.message; 
  } finally { 
    button.disabled = false; 
    button.innerHTML = 'CHECK LINK <span>↗</span>'; 
  }
});

input.addEventListener("keydown", e => { if (e.key === "Enter") button.click(); });
