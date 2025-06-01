var svg = d3.select("#map"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    tooltip = d3.select("#tooltip");

// World Map Projection
var projection = d3.geoNaturalEarth1().scale(130).translate([width / 2, height / 2]);
var path = d3.geoPath().projection(projection);
var medalData = d3.map();

// color gradient - starts from medium blue instead of very light
function customInterpolateBlues(t) {
    return d3.interpolateBlues(t * 0.7 + 0.3); }
var colorScale = d3.scaleSequential(customInterpolateBlues);

// Load data
d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    .defer(d3.csv, "medals_total.csv", function(d) {
        medalData.set(d.country_code, {
            name: d.country_long || d.country,
            gold: +d["Gold Medal"],
            silver: +d["Silver Medal"],
            bronze: +d["Bronze Medal"],
            total: +d.Total
        });
    })
    .await(function(error, topo) {
        if (error) throw error;
        
var medalValues = Array.from(medalData.values(), d => d.total).filter(d => d > 0);
var maxMedals = d3.max(medalValues) || 1;
colorScale.domain([1, maxMedals]);

const g = svg.append("g"); 
    svg.insert("rect", ":first-child")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("click", function() {
    g.transition()
        .duration(750)
        .attr("transform", "translate(0,0) scale(1)");
    g.selectAll(".country").classed("selected", false);
});

// Draw countries
g.selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", function(d) {
    var country = medalData.get(d.id);
    var total = (country && country.total) ? country.total : 0;
        return total === 0 ? "#e0e0e0" : colorScale(total);
    })
    .attr("stroke", "white")
    .attr("stroke-width", "0.7px")
    .on("mouseover", function(d) {
    var country = medalData.get(d.id) || {
        name: d.properties.name,
        gold: 0, silver: 0, bronze: 0, total: 0
    };
d3.select(this)
    .attr("stroke-width", "1.5px");

tooltip.html(`
    <div class="tooltip-title">${country.name}</div>
    <div class="tooltip-value">🥇 ${country.gold} 🥈 ${country.silver} 🥉 ${country.bronze}</div>
    <div class="tooltip-total">Total: ${country.total}</div>
`).style("opacity", 1);
})
    .on("mousemove", function() {
    const [x, y] = d3.mouse(svg.node()); 
    tooltip
    .style("left", (x + 8) + "px")
    .style("top", (y + 30) + "px");
    })
    .on("mouseout", function() {
    d3.select(this).attr("stroke-width", "0.7px");
    tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
    g.selectAll(".country").classed("selected", false);

d3.select(this)
    .classed("selected", true)
    .raise();
    
//Zoom-in:)
const bounds = path.bounds(d);
const dx = bounds[1][0] - bounds[0][0];
const dy = bounds[1][1] - bounds[0][1];
const x = (bounds[0][0] + bounds[1][0]) / 2;
const y = (bounds[0][1] + bounds[1][1]) / 2;
const scale = Math.max(1, Math.min(4, 0.7 / Math.max(dx / width, dy / height)));
const translate = [width / 2 - scale * x, height / 2 - scale * y];

g.transition()
    .duration(750)
    .attr("transform", `translate(${translate}) scale(${scale})`);
});

// legend
var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(30,30)");

var defs = svg.append("defs");
var gradient = defs.append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

gradient.selectAll("stop")
.data([
    { offset: "0%", color: customInterpolateBlues(0) },
    { offset: "100%", color: customInterpolateBlues(1) }
])
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

legend.append("rect")
    .attr("width", 200)
    .attr("height", 20)
    .style("fill", "url(#gradient)");

var x = d3.scaleLinear()
    .domain([0, maxMedals])
    .range([0, 200]);

legend.append("g")
    .attr("transform", "translate(0,20)")
    .call(d3.axisBottom(x).ticks(5));

legend.append("text")
    .attr("x", 100)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text("Total Medals");
});
