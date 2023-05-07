<script>
  import P5 from "p5-svelte";

  const sketch = (p5) => {
    p5.preload = () => {
      p5.font = p5.loadFont("/fonts/PlusJakartaSans/VariableFont_wght.ttf");

    }
		p5.setup = () => {
			p5.createCanvas(p5.windowWidth, p5.windowHeight, p5.WEBGL);
			p5.background(0);
			p5.stroke('#ed225d');
      p5.textFont(p5.font);
      p5.textSize(32);

		};

		p5.draw = () => {
      p5.text('Discussion Page', 20, 30);
		};

    // p5.windowResized = () => {
    //   p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    // }
	};
</script>

<P5 {sketch} />