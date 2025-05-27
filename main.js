/*
Tree Map: 
Used https://d3-graph-gallery.com/graph/treemap_basic.html as a reference 
*/

d3.csv("dataset/medals.csv").then(data => {

let countryFilteredData = data.filter(d => d.country === "United States");

// to store all the different disciplines to then sort and find out which has the most medals 
const allDisciplines = {}; 

countryFilteredData.forEach(d => {
  if (!allDisciplines[d.discipline]) {
    allDisciplines[d.discipline] = 0;
  } 
    allDisciplines[d.discipline]++;
});

const top10 = Object.entries(allDisciplines)
  .sort((a, b) => b[1] - a[1]) // most to least
  .slice(0, 10); // I want only the top 10 

console.log("Top 10 USA events:", top10);


dataTreeMap = {
  name: "USA Medals",
  children: top10.map(([name, value]) => ({ name, value })) // need to do this so it works for the root later 
};

const svg = d3.select("svg"); // creating a SVG 

const width = 500;
const height = 400;

const root = d3.hierarchy(dataTreeMap)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

// making the actual treemap here with this function sot hat we know the width and the height 
d3.treemap()
    .size([width, height])
    .padding(4)
    (root);

// drawing the actual squares here to show there 
svg.selectAll("rect")
    .data(root.leaves())
    .enter()
    .append("rect")
        .attr('x', x => x.x0) // the x placement 
        .attr('y', y => y.y0) // y placement 
        // the size depends on how many medals each country got 
        .attr('width', x => x.x1 - x.x0)
        .attr('height', y => y.y1 - y.y0)
        .style("stroke", "white")
        .style("fill", color => d3.interpolateViridis(color.value / root.value)); // based on the rect so the color gradient is here 

// all the names 
svg.selectAll("text").data(root.leaves()).enter()
    .append("text")
        .attr("x", d => d.x0 + 3)
        .attr("y", d => d.y0 + 20)
        .text(d => d.data.name)
        .attr("font-size", "10px")
        .attr("fill", "white")

});