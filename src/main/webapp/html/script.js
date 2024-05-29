let accountCount = null;
let accountsPerPage = 3;
let accountsAmount = null;
let currentPageNumber = 0;

const RACE_ARRAY = ["HUMAN", "DWARF", "ELF", "GIANT", "ORC", "TROLL", "HOBBIT"];
const PROFESSION_ARRAY = ["WARRIOR", "ROGUE", "SORCERER", "CLERIC", "PALADIN", "NAZGUL", "WARLOCK", "DRUID"];
const BANNED_ARRAY = ["true", "false"];


createAccountPerPageDropDawn()
fillTable(currentPageNumber, accountsPerPage)
updatePlayersCount()
initCreateForm()

function initCreateForm() {
    const $raceSelect = document.querySelector('[data-create-race]');
    const $professionSelect = document.querySelector('[data-create-profession]');

    $raceSelect.insertAdjacentHTML("afterbegin", createSelectOptions(RACE_ARRAY, RACE_ARRAY[0]))
    $professionSelect.insertAdjacentHTML("afterbegin", createSelectOptions(PROFESSION_ARRAY, PROFESSION_ARRAY[0]))

}

function fillTable(pageNumber, pageSize) {
    $.get(`/rest/players?pageNumber=${pageNumber}&pageSize=${pageSize}`, (players) => {
        const $playersTableBody = $('.players-table-body')[0];
        const childButtonsCount = $playersTableBody.children.length;
        let htmlRows = '';
        players.forEach((player) => {
            htmlRows += `<tr class="row" data-account-id="${player.id}">
                    <td class="cell" data-account-id>${player.id}</td>
                    <td class="cell" data-account-named>${player.name}</td>
                    <td class="cell" data-account-title>${player.title}</td>
                    <td class="cell" data-account-race>${player.race}</td>
                    <td class="cell" data-account-profession>${player.profession}</td>
                    <td class="cell" data-account-level>${player.level}</td>
                    <td class="cell" data-account-birthday>${new Date(player.birthday).toLocaleDateString()}</td>
                    <td class="cell" data-account-banned>${player.banned}</td>
                    <td class="cell">
                        <button class="edit-button" value="${player.id}">
                        <img src="../img/edit.png" alt="edit">
                       </button>
                    </td>
                    <td class="cell">
                        <button class="delete-button" value="${player.id}">
                        <img src="../img/delete.png" alt="delete">
                       </button>
                    </td>
                 </tr>`
        });

        if (childButtonsCount !== 0) {
            Array.from($playersTableBody.children).forEach(row => row.remove())
        }

        $playersTableBody.insertAdjacentHTML("beforeend", htmlRows)

        $('.delete-button').toArray().forEach(button => button.addEventListener('click', removeAccountHandler))
        $('.edit-button').toArray().forEach(button => button.addEventListener('click', editAccountHandler))
    });

}

function createAccountPerPageDropDawn() {
    const $dropDown = document.querySelector(`.accounts-per-page`);
    const options = createSelectOptions([3, 5, 10, 20], 3)
    $dropDown.addEventListener('change', onSelectorChange)
    $dropDown.insertAdjacentHTML('afterbegin', options);
}

function updatePlayersCount() {
    $.get('/rest/players/count', (count) => {
        accountCount = count;
        updatePaginationButtons()
    });
}

function updatePaginationButtons() {
    accountsAmount = accountCount ? Math.ceil(accountCount / accountsPerPage) : 0;

    const $buttonsContainer = document.querySelector('.pagination-buttons');
    const childButtonsCount = $buttonsContainer.children.length;

    let paginationButtonHtml = '';

    for (let i = 1; i <= accountsAmount; i++) {
        paginationButtonHtml += `<button value="${i - 1}">${i}</button>`
    }

    if (childButtonsCount !== 0) {
        Array.from($buttonsContainer.children).forEach(node => node.remove())
    }

    $buttonsContainer.insertAdjacentHTML("beforeend", paginationButtonHtml);

    Array.from($buttonsContainer.children).forEach(button => button.addEventListener('click', onPageChange))
    makeButtonActive(currentPageNumber)
}

function makeButtonActive(currentPageIndex = 0) {
    const $buttonsContainer = document.querySelector('.pagination-buttons');
    const $targetButton = Array.from($buttonsContainer.children)[currentPageIndex];
    const $currentActiveButton = Array.from($buttonsContainer.children)[currentPageNumber];

    $currentActiveButton.classList.remove('active-pagination-button')
    $targetButton.classList.add('active-pagination-button')
}

function createAccount() {

    const data = {
        name: $('[data-create-name]').val(),
        title: $('[data-create-title]').val(),
        race: $('[data-create-race]').val(),
        profession: $('[data-create-profession]').val(),
        level: $('[data-create-level]').val(),
        birthday: new Date($('[data-create-birthday]').val()).getTime(),
        banned: $('[data-create-banned]').val() === 'on',
    }

    $.ajax({
        url: `/rest/players/`,
        type: 'POST',
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json",
        success: function () {
            updatePlayersCount();
            fillTable(currentPageNumber, accountsPerPage);
        }
    })

}

function onSelectorChange(e) {
    accountsPerPage = e.currentTarget.value;
    fillTable(currentPageNumber, accountsPerPage);
    updatePaginationButtons();
}

function onPageChange(e) {
    const targetPageIndex = e.currentTarget.value;
    makeButtonActive(targetPageIndex)

    currentPageNumber = targetPageIndex;
    fillTable(currentPageNumber, accountsPerPage);
    // makeButtonActive(currentPageNumber);
}

function removeAccountHandler(e) {
    const accountId = e.currentTarget.value;

    $.ajax({
        url: `/rest/players/${accountId}`,
        type: 'DELETE',
        success: function () {
            updatePlayersCount()
            fillTable(currentPageNumber, accountsPerPage)
        }
    })
}

function saveChanges({accountId, data}) {
    $.ajax({
        url: `/rest/players/${accountId}`,
        type: 'POST',
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json",
        success: function () {
            updatePlayersCount()
            fillTable(currentPageNumber, accountsPerPage)
        }
    })
}

function editAccountHandler(e) {
    const accountId = e.currentTarget.value;

    const $currentRow = document.querySelector(`.row[data-account-id='${accountId}']`);
    const $currentRemoveButton = $currentRow.querySelector('.delete-button img');
    const $currentImage = $currentRow.querySelector('.edit-button img');


    const $currentName = $currentRow.querySelector('[data-account-named]')
    const $currentTitle = $currentRow.querySelector('[data-account-title]')
    const $currentRace = $currentRow.querySelector('[data-account-race]')
    const $currentProfession = $currentRow.querySelector('[data-account-profession]')
    const $currentBanned = $currentRow.querySelector('[data-account-banned]')

    $currentRemoveButton.remove();
    $currentImage.src = "../img/save.png";
    $currentImage.addEventListener('click', () =>{
        const params = {
            accountId: accountId,
            data: {
                name: $currentName.firstChild.getAttribute('data-value'),
                title: $currentTitle.firstChild.getAttribute('data-value'),
                race: $currentRace.firstChild.getAttribute('data-value'),
                profession: $currentProfession.firstChild.getAttribute('data-vaclue'),
                banned: $currentBanned.firstChild.getAttribute('data-value')
            }

        }
        saveChanges(params);

    })

    $currentName.firstChild.replaceWith(createInput($currentName.innerHTML));
    $currentTitle.firstChild.replaceWith(createInput($currentTitle.innerHTML));
    $currentRace.firstChild.replaceWith(createSelect(RACE_ARRAY, $currentRace.innerHTML));
    $currentProfession.firstChild.replaceWith(createSelect(PROFESSION_ARRAY,$currentProfession.innerHTML));
    $currentBanned.firstChild.replaceWith(createSelect(BANNED_ARRAY, $currentBanned.innerHTML));


}

function createSelect(optionsArray, defaultValue) {
    const options = createSelectOptions(optionsArray,defaultValue);
    const $selectElement = document.createElement('select');

    $selectElement.insertAdjacentHTML("afterbegin",options);
    $selectElement.setAttribute("data-value", defaultValue);
    $selectElement.addEventListener("change", e => {
        $selectElement.setAttribute("data-value", e.currentTarget.value);
    })


    return $selectElement;
}

function createSelectOptions(optionsArray, defaultValue) {
    let optionHtml = '';

    optionsArray.forEach(option => optionHtml +=
        `<option ${defaultValue === option && 'selected'} value="${option}">
            ${option}
        </option>`)

    return optionHtml;
}

function createInput(value) {
    const $htmlInputElement = document.createElement('input');

    $htmlInputElement.setAttribute('type', 'text')
    $htmlInputElement.setAttribute('value', value)
    $htmlInputElement.setAttribute('data-value', value)

    $htmlInputElement.addEventListener('input', e => {
        $htmlInputElement.setAttribute('data-value', `${e.currentTarget.value}`)
    })
    return $htmlInputElement;
}

function getCreateFormFields() {
    const name = document.getElementById('create-name');
    const title = document.getElementById('create-title');
    const race = document.getElementById('create-race');
    const profession = document.getElementById('create-profession');
    const level = document.getElementById('create-level');
    const birthday = document.getElementById('create-birthday');
    const banned = document.getElementById('create-banned');
    return {name,title,race,profession,level,birthday,banned};

}
