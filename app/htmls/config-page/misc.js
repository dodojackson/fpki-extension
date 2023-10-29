/**
 * Popup to force yes-or-no decision
 * 
 * Call like this:  
 * let answer = await misc.showPopup("Möchten Sie fortfahren?");
 * 
 * TODO: allgemeiner, entscheidungsmöglichkeiten per parameter übergeben
 */
export async function showPopup(message) {
    return new Promise((resolve, reject) => {
        console.log("Something happened");
        const modal = document.createElement('div');
        modal.className = 'modal';

        const modal_content = document.createElement('div');
        modal_content.classList.add('modal-content');

        const yes_btn = document.createElement('button');
        yes_btn.textContent = "Yes";
        const no_btn = document.createElement('button');
        no_btn.textContent = "No";
        const msg = document.createElement('p');
        msg.textContent = message;
        // event listeners
        yes_btn.addEventListener('click', () => {
            modal.style.display = 'none';
            modal.remove();
            resolve("yes");
        });
        no_btn.addEventListener('click', () => {
            modal.style.display = 'none';
            modal.remove();
            resolve("no");
        });

        modal_content.appendChild(msg);
        modal_content.appendChild(yes_btn);
        modal_content.appendChild(no_btn);

        modal.appendChild(modal_content);
        document.body.appendChild(modal);
    });
}


/**
 * Toggle display status of an element
 */
export function toggleElement(box) {
    if (box.hidden === true) {
        box.hidden = false;
    } else {
        box.hidden = true;
    }
}