$('.navTrigger').click(function () {
    $(this).toggleClass('active');
    console.log("Clicked menu");
    $("#mainListDiv").toggleClass("show_list");
    $("#mainListDiv").fadeIn();
});

document.addEventListener('DOMContentLoaded', function () {
    fetchMessages();

    function fetchMessages() {
        fetch('http://localhost:5000/messages')
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('messagesContainer');
                container.innerHTML = ''; // Önce temizle
                data.forEach(msg => {
                    const card = document.createElement('div');
                    card.classList.add('message-card');

                    let imageHTML = '';
                    if (msg.image) {
                        imageHTML = `<img src="${msg.image}" alt="Gönderilen Görsel" style="max-width: 200px; display: block; margin-top: 5px;">`;
                    }

                    const fullMessage = msg.message;
                    const shortMessage = fullMessage.length > 100 ? fullMessage.substring(0, 100) + "..." : fullMessage;
                    const hasReadMore = fullMessage.length > 100;

                    card.innerHTML = `
                        <div class="card">
                            <h4>${msg.username}</h4>
                            <p class="short-text">${shortMessage}</p>
                            <p class="full-text" style="display: none;">${fullMessage}</p>
                            <span>${new Date(msg.created_at).toLocaleString()}</span>
                            ${imageHTML}
                            ${hasReadMore ? `<button class="read-more">Devamını Oku</button>` : ''}
                        </div>
                    `;
                    container.appendChild(card);

                    if (hasReadMore) {
                        const readMoreBtn = card.querySelector(".read-more");
                        const shortText = card.querySelector(".short-text");
                        const fullText = card.querySelector(".full-text");

                        readMoreBtn.addEventListener("click", function () {
                            if (fullText.style.display === "none") {
                                fullText.style.display = "block";
                                shortText.style.display = "none";
                                readMoreBtn.innerText = "Kapat";
                            } else {
                                fullText.style.display = "none";
                                shortText.style.display = "block";
                                readMoreBtn.innerText = "Devamını Oku";
                            }
                        });
                    }
                });
            })
            .catch(error => console.error('Mesajları alırken hata:', error));
    }
});

document.getElementById('messageForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const formData = new FormData(this);

    const response = await fetch('/messages', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    console.log(result);
    fetchMessages(); // Yeni mesajı aldıktan sonra listeyi güncelle
});

document.addEventListener("DOMContentLoaded", function() {
    let messagesContainer = document.getElementById("messagesContainer");

    for (let i = 1; i <= 9; i++) {
        let div = document.createElement("div");
        div.className = "message";
        div.textContent = i + ". Mesaj";
        messagesContainer.appendChild(div);
    }
});
