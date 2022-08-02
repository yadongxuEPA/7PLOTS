function tooltip(el) {
  let box;
  const padding = 8;

  function show(content) {
    el.innerHTML = content;
    box = el.getBoundingClientRect();
    el.classList.add("show");
  }

  function hide() {
    el.classList.remove("show");
  }

  function move(event) {
    let x = event.pageX + padding;
    if (x + box.width > window.innerWidth) {
      x = window.innerWidth - box.width;
    }
    let y = event.pageY + padding;
    el.style.transform = `translate(${x}px,${y}px)`;
  }

  return {
    show,
    hide,
    move,
    el,
  };
}
