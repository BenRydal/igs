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
      p5.text("Jordan Page", 30, 40);
      p5.text(p5.windowWidth, 30, 60);
      p5.text(p5.windowHeight, 30, 80);
		};

    p5.windowResized = () => {
      console.log("Running")
      if (p5) {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight, p5.WEBGL)
        p5.setup();
      }
    }

	};
</script>

<P5 {sketch} />