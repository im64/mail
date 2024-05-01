document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').addEventListener('submit', submitComposeForm)

    // By default, load the inbox
    load_mailbox('inbox');
});

function createDivWithClass(divClassName, text) {
    const div = document.createElement('div')
    div.className = divClassName
    div.textContent = text
    return div
}

function createLetterRow(email, couldBeArchived) {
    const letter = createDivWithClass('letter')
    if (email.read === false) letter.classList.add('unread')

    const elements = []
    if (couldBeArchived) {
        elements.push(createDivWithClass('archive', 'A'))
    }

    elements.push(
        createDivWithClass('sender', email.sender),
        createDivWithClass('subject', email.subject),
        createDivWithClass('timesent', email.time),
    )

    elements.forEach((element) => {
        letter.appendChild(element)
    })
    return letter
}

function createContentOfEmailView(sender, recipients, subject, time, body) {
    const letterView = document.getElementById('letter-view')

    const elements = [
        createDivWithClass('sender', 'Sender: ' + sender),
        createDivWithClass('recipients', 'Recipients: ' + recipients),
        createDivWithClass('subject', 'Subject: ' + subject),
        createDivWithClass('timesent', 'Time sent: ' + time),
        document.createElement('hr'),
        createDivWithClass('body', body),
    ]
    elements.forEach((element) => {
        letterView.appendChild(element)
    })
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#letter-view').style.display = 'none';

    // Show the mailbox name
    const emailsView = document.querySelector('#emails-view')
    emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Fetch emails
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            console.log(emails);
            const container = document.createElement('div')
            container.className = 'emails-container'
            document.querySelector('#emails-view').append(container)

            emails.forEach(email => {
                const ltr = createLetterRow(email, mailbox !== 'sent')
                ltr.addEventListener('click', () => { loadLetter(email.id) })
                const archiveELement = ltr.querySelector('.archive')
                if (archiveELement != null) {
                    archiveELement.addEventListener('click', (event, ltr) => {
                        event.stopPropagation()
                        changeArchivedFieldAndReload(email, mailbox)
                    })
                }
                container.append(ltr)
            })
        });
}
function changeArchivedFieldAndReload(email, mailbox) {
    // const value = email.archived
    fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
    }).then(() => {
        load_mailbox(mailbox)
    })
}

function loadLetter(id) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    const letterView = document.querySelector('#letter-view')
    letterView.style.display = 'block';
    letterView.textContent = ''
    letterView.style.display = 'block';

    fetch(`/emails/${id}`)
        .then(response => {
            if (response.ok) {
                fetch(`/emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        read: true
                    })
                })
                return response.json()
            } else {
                alert(`Fetching email with ${id} failed`)
                load_mailbox('inbox')
            }
        })
        .then(email => {
            createContentOfEmailView(email.sender, email.recipients, email.subject, email.timestamp, email.body)
        });
}

function compose_email() {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#letter-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = ''
    document.querySelector('#compose-subject').value = ''
    document.querySelector('#compose-body').value = ''
}

function submitComposeForm(event) {
    event.preventDefault()

    let jsonLetter = {}
    jsonLetter.recipients = document.querySelector('#compose-recipients').value
    jsonLetter.subject = document.querySelector('#compose-subject').value
    jsonLetter.body = document.querySelector('#compose-body').value
    jsonLetter.read = false

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify(jsonLetter)
    })
        .then(response => response.json())
        .then(result => {
            console.log(result)
            if (result.error !== undefined) {
                alert(result.error)
            } else {
                load_mailbox('sent')
            }
        })
}
