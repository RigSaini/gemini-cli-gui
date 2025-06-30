const promptList = document.getElementById('promptList');
const newPrompt = document.getElementById('prompt');

document.getElementById('submit').addEventListener('click', () => {
  const promptText = newPrompt.value.trim();
  if (!promptText) return;

  const li = document.createElement('li');
  li.textContent = promptText;
  promptList.appendChild(li);

  newPrompt.value = ''; // clear textarea
});
