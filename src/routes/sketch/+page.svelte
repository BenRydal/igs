<script>
  import P5 from "p5-svelte";

  const sketch = (p5) => {
		p5.setup = () => {
			p5.createCanvas(window.innerWidth, window.innerHeight, p5.WEBGL);
			p5.background(0);
			p5.stroke('#ed225d');
		};

		p5.draw = () => {
			p5.translate(p5.width / 2, p5.height / 2);

			let v = p5.createVector(p5.random(-100, 100), p5.random(-100, 100));
			v.mult(p5.random(50, 100));

			p5.strokeWeight(1);
			p5.line(0, 0, v.x, v.y);
		};
	};
</script>

<P5 {sketch} />