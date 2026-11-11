document.addEventListener("DOMContentLoaded", () => {
  // Navegação mobile
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");

  menuButton?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });

  // Alternância das abas de exemplos
  const tabs = document.querySelectorAll(".code-tab");
  const panels = document.querySelectorAll(".code-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });

      panels.forEach(panel => {
        panel.classList.toggle("active", panel.id === `tab-${tab.dataset.tab}`);
      });
    });
  });

  // Copiar exemplos para a área de transferência
  const toast = document.querySelector(".toast");
  let toastTimer;

  document.querySelectorAll(".copy-button").forEach(button => {
    button.addEventListener("click", async () => {
      const code = document.getElementById(button.dataset.copy);
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code.innerText);
        button.textContent = "Copiado ✓";
        toast.textContent = "Código copiado para a área de transferência.";
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toast.classList.remove("show");
          button.textContent = "Copiar código ⧉";
        }, 1800);
      } catch {
        toast.textContent = "Não foi possível copiar. Selecione o código manualmente.";
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
      }
    });
  });
});
