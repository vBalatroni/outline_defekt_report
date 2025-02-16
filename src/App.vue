<template>
  <RouterView />
</template>

<style>
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  --black-color: #000;
  --light-color:#E6E6E6;
  --font-family: 'IBM Plex Mono', monospace;
}

body {
  font-family: var(--font-family);
}

.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 240px;
}
/* 
.cancel-btn {
  background: var(--light-color);
  border: 2px solid var(--dark-color);
  color: var(--dark-color);
  padding: 10px 20px;
}

.start-btn {
  background: var(--secondary-color);
  color: var(--light-color);
  padding: 10px 20px;
}


.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn {
    padding: 10px 20px;
    border: none;
    cursor: pointer;
}
.primary-btn {
    background: var(--black-color);
    color: var(--light-color);
}

.btn.disabled {
    opacity: .5; 
} */
</style>

