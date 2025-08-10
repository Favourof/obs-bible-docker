document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const resultsDiv = document.getElementById("results");

  // Handle Search
  searchBtn.addEventListener("click", async () => {
    const ref = document.getElementById("reference").value.trim();
    console.log(ref);

    const resultsDiv = document.getElementById("results");

    // Improved regex to handle multi-word book names & numbers
    const match = ref.match(/^([\dA-Za-z\s]+)\s+(\d+):(\d+)$/);
    if (!match) {
      resultsDiv.innerHTML = "Invalid format. Example: John 3:16 or 1 John 4:8";
      return;
    }

    let book = match[1].trim();
    const chapter = match[2];
    const verse = match[3];

    const response = await fetch(
      `/api/search?book=${encodeURIComponent(
        book
      )}&chapter=${chapter}&verse=${verse}`
    );

    if (response.ok) {
      const data = await response.json();
      resultsDiv.innerHTML = `
      <strong>${data.reference} (KJV)</strong>
      <div class="verse-text">${data.text}</div>
      <br/>
      <button class="send-to-obs" 
              data-reference="${data.reference} (KJV)" 
              data-text="${data.text}">Send to OBS</button>
    `;
    } else {
      resultsDiv.innerHTML = "no bible here baba";
    }
  });

  resultsDiv.addEventListener("click", async (e) => {
    if (e.target.classList.contains("send-to-obs")) {
      const reference = e.target.dataset.reference;
      const text = e.target.dataset.text;
      const res = await fetch("/api/set-latest-verse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, text }),
      });
      if (res.ok) {
        console.log(res);

        // alert(`✅ Sent to OBS: ${reference}`);
      }
    }
  });
});
