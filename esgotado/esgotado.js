(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Revelação ao rolar — mesmo comportamento do site principal. */
  const revealItems = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      revealObserver.observe(item);
    });
  }

  /* Foco viajante da manchete: uma palavra nítida por vez, moldura de mira
     acompanhando. Pausa fora da tela e desliga com reduced-motion — o efeito
     é decorativo, não pode custar bateria. */
  const foco = document.querySelector("[data-true-focus]");
  if (foco && !prefersReducedMotion && "IntersectionObserver" in window) {
    const palavras = [...foco.querySelectorAll(".tf-word")];
    const moldura = foco.querySelector(".tf-frame");
    const MARGEM = 8;
    let atual = 0;
    let timer = null;

    const focar = (indice) => {
      palavras.forEach((palavra, i) => palavra.classList.toggle("tf-blur", i !== indice));
      const base = foco.getBoundingClientRect();
      const alvo = palavras[indice].getBoundingClientRect();
      moldura.style.transform = `translate(${alvo.left - base.left - MARGEM}px, ${alvo.top - base.top - MARGEM}px)`;
      moldura.style.width = `${alvo.width + MARGEM * 2}px`;
      moldura.style.height = `${alvo.height + MARGEM * 2}px`;
      moldura.classList.add("is-on");
    };

    const passo = () => {
      focar(atual);
      atual = (atual + 1) % palavras.length;
    };

    const liga = () => {
      if (timer) return;
      passo();
      timer = window.setInterval(passo, 1400);
    };

    const desliga = () => {
      window.clearInterval(timer);
      timer = null;
    };

    new IntersectionObserver(([entrada]) => (entrada.isIntersecting ? liga() : desliga()), {
      threshold: 0.35,
    }).observe(foco);

    window.addEventListener("resize", () => {
      if (timer) focar((atual + palavras.length - 1) % palavras.length);
    }, { passive: true });
  }

  /* Máscara do WhatsApp: (00) 00000-0000, aceitando fixo de 8 dígitos. */
  const telefone = document.getElementById("whats");
  telefone.addEventListener("input", () => {
    const d = telefone.value.replace(/\D/g, "").slice(0, 11);
    let out = d;
    if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) {
      const corte = d.length === 10 ? 6 : 7;
      out = `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
    }
    telefone.value = out;
  });

  /* Envio para a lista de espera. */
  const form = document.getElementById("form-espera");
  const erro = document.getElementById("form-erro");
  const sucesso = document.getElementById("form-sucesso");
  const intro = document.querySelector(".sold-card-intro");
  const botao = form.querySelector(".sold-submit");
  const rotulo = botao.querySelector(".sold-submit-label");

  const mostraErro = (mensagem) => {
    erro.textContent = mensagem;
    erro.hidden = false;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    erro.hidden = true;

    /* Robô que preencheu o campo invisível não gera requisição nenhuma. */
    if (form.website.value) return;

    const dados = {
      name: document.getElementById("nome").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: telefone.value.trim(),
      consent: document.getElementById("aceite").checked,
      consentText: document.getElementById("texto-aceite").textContent.replace(/\s+/g, " ").trim(),
      product: "levefit",
      source: "esgotado",
    };

    const digitos = dados.phone.replace(/\D/g, "");
    const campos = [
      [document.getElementById("nome"), dados.name.length >= 2],
      [document.getElementById("email"), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)],
      [telefone, digitos.length >= 10 && digitos.length <= 11],
    ];
    let valido = true;
    campos.forEach(([campo, ok]) => {
      campo.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) valido = false;
    });
    if (!valido) {
      mostraErro("Confira os campos destacados: nome, e-mail e WhatsApp com DDD.");
      return;
    }
    if (!dados.consent) {
      mostraErro("Para entrar na lista, é preciso aceitar o termo de aviso.");
      return;
    }

    botao.disabled = true;
    rotulo.textContent = "Enviando…";

    try {
      const resposta = await fetch("/api/public/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        const mensagem = Array.isArray(corpo?.message) ? corpo.message[0] : corpo?.message;
        throw new Error(mensagem || "Não conseguimos salvar agora. Tente de novo em instantes.");
      }

      form.hidden = true;
      if (intro) intro.hidden = true;
      sucesso.hidden = false;
      sucesso.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    } catch (excecao) {
      mostraErro(excecao.message || "Não conseguimos salvar agora. Tente de novo em instantes.");
      botao.disabled = false;
      rotulo.textContent = "Entrar na Lista da Volta";
    }
  });
})();
