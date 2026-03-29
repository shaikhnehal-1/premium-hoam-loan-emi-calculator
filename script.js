/**
 * Home Loan EMI Calculator Logic
 */

// Scenario 1 Elements
const loanAmountInput = document.getElementById('loanAmount');
const loanAmountDisplay = document.getElementById('loanAmountDisplay');
const tenureInput = document.getElementById('tenure');
const tenureDisplay = document.getElementById('tenureDisplay');
const interestRateInput = document.getElementById('interestRate');
const interestRateDisplay = document.getElementById('interestRateDisplay');

// Scenario 2 Elements
const loanAmountInput2 = document.getElementById('loanAmount2');
const loanAmountDisplay2 = document.getElementById('loanAmountDisplay2');
const tenureInput2 = document.getElementById('tenure2');
const tenureDisplay2 = document.getElementById('tenureDisplay2');
const interestRateInput2 = document.getElementById('interestRate2');
const interestRateDisplay2 = document.getElementById('interestRateDisplay2');

// UI Elements
const monthlyEmiEl = document.getElementById('monthlyEmi');
const totalPrincipalEl = document.getElementById('totalPrincipal');
const totalInterestEl = document.getElementById('totalInterest');
const totalPayableEl = document.getElementById('totalPayable');
const chartContainer = document.getElementById('chart');
const scheduleBody = document.getElementById('scheduleBody');

// Mode Toggle Elements
const singleModeBtn = document.getElementById('singleModeBtn');
const compareModeBtn = document.getElementById('compareModeBtn');
const scenario1 = document.getElementById('scenario1');
const results1 = document.getElementById('results1');
const scenario2 = document.getElementById('scenario2');
const calculatorGrid = document.getElementById('calculatorGrid');

// Comparison Display Elements
const compEmi1 = document.getElementById('compEmi1');
const compEmi2 = document.getElementById('compEmi2');
const compInt1 = document.getElementById('compInt1');
const compInt2 = document.getElementById('compInt2');
const compTotal1 = document.getElementById('compTotal1');
const compTotal2 = document.getElementById('compTotal2');
const comparisonInsight = document.getElementById('comparisonInsight');

let isCompareMode = false;

/**
 * Format number as Indian Rupee
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse currency string to number
 */
function parseCurrency(str) {
  return Number(str.replace(/[^0-9.-]+/g, ""));
}

/**
 * Calculate EMI and details for a scenario
 */
function calculateScenario(principal, tenureYears, annualRate) {
  const monthlyRate = annualRate / (12 * 100);
  const numberOfMonths = tenureYears * 12;

  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) / 
              (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

  const totalAmount = emi * numberOfMonths;
  const totalInterest = totalAmount - principal;

  return { emi, totalAmount, totalInterest, principal, tenureYears, numberOfMonths, monthlyRate };
}

/**
 * Generate Amortization Schedule
 */
function generateSchedule(scenario) {
  const { principal, monthlyRate, numberOfMonths, emi } = scenario;
  let balance = principal;
  let html = '';

  for (let i = 1; i <= numberOfMonths; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = emi - interest;
    balance -= principalPaid;

    // Only show every 12th month or first/last to keep UI clean if it's too long? 
    // Actually user asked for "each monthly payment", so let's show all but maybe with a scroll.
    html += `
      <tr>
        <td class="p-4 font-medium text-slate-900">${i}</td>
        <td class="p-4">${formatCurrency(principalPaid)}</td>
        <td class="p-4">${formatCurrency(interest)}</td>
        <td class="p-4 font-semibold text-blue-600">${formatCurrency(emi)}</td>
        <td class="p-4 text-slate-400">${formatCurrency(Math.max(0, balance))}</td>
      </tr>
    `;
  }
  scheduleBody.innerHTML = html;
}

/**
 * Main Calculation Trigger
 */
function calculateAll() {
  const s1 = calculateScenario(
    Number(loanAmountInput.value),
    Number(tenureInput.value),
    Number(interestRateInput.value)
  );

  // Update Scenario 1 UI
  monthlyEmiEl.textContent = formatCurrency(s1.emi);
  totalPrincipalEl.textContent = formatCurrency(s1.principal);
  totalInterestEl.textContent = formatCurrency(s1.totalInterest);
  totalPayableEl.textContent = formatCurrency(s1.totalAmount);

  if (isCompareMode) {
    const s2 = calculateScenario(
      Number(loanAmountInput2.value),
      Number(tenureInput2.value),
      Number(interestRateInput2.value)
    );

    // Update Comparison Table
    compEmi1.textContent = formatCurrency(s1.emi);
    compEmi2.textContent = formatCurrency(s2.emi);
    compInt1.textContent = formatCurrency(s1.totalInterest);
    compInt2.textContent = formatCurrency(s2.totalInterest);
    compTotal1.textContent = formatCurrency(s1.totalAmount);
    compTotal2.textContent = formatCurrency(s2.totalAmount);

    // Insight
    const intDiff = Math.abs(s1.totalInterest - s2.totalInterest);
    const emiDiff = Math.abs(s1.emi - s2.emi);
    const cheaper = s1.totalInterest < s2.totalInterest ? 'Scenario A' : 'Scenario B';
    comparisonInsight.textContent = `${cheaper} saves you ${formatCurrency(intDiff)} in total interest. Scenario A has a ${s1.emi < s2.emi ? 'lower' : 'higher'} monthly commitment by ${formatCurrency(emiDiff)}.`;
    
    updateChart(s1.principal, s1.totalInterest, s2.principal, s2.totalInterest);
  } else {
    updateChart(s1.principal, s1.totalInterest);
  }

  generateSchedule(s1);
}

/**
 * Update D3 Chart (Supports Single or Comparison)
 */
function updateChart(p1, i1, p2 = null, i2 = null) {
  const width = chartContainer.clientWidth;
  const height = chartContainer.clientHeight;
  const radius = Math.min(width, height) / 2;

  d3.select("#chart").selectAll("*").remove();

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  if (p2 === null) {
    // Single Pie
    const data = [
      { label: "Principal", value: p1, color: "#2563eb" },
      { label: "Interest", value: i1, color: "#10b981" }
    ];

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);

    svg.selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => d.data.color)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0.8);

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#64748b")
      .text("Breakdown");
  } else {
    // Comparison Bar Chart instead of Pie for better side-by-side
    svg.attr("transform", "translate(0,0)");
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand().rangeRound([0, chartWidth]).paddingInner(0.1);
    const x1 = d3.scaleBand().padding(0.05);
    const y = d3.scaleLinear().rangeRound([chartHeight, 0]);

    const categories = ["Scenario A", "Scenario B"];
    const metrics = ["Principal", "Interest"];
    const data = [
      { category: "Scenario A", Principal: p1, Interest: i1 },
      { category: "Scenario B", Principal: p2, Interest: i2 }
    ];

    x0.domain(categories);
    x1.domain(metrics).rangeRound([0, x0.bandwidth()]);
    y.domain([0, d3.max(data, d => d.Principal + d.Interest)]).nice();

    g.append("g")
      .selectAll("g")
      .data(data)
      .enter().append("g")
      .attr("transform", d => `translate(${x0(d.category)},0)`)
      .selectAll("rect")
      .data(d => metrics.map(key => ({ key, value: d[key] })))
      .enter().append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => chartHeight - y(d.value))
      .attr("fill", d => d.key === "Principal" ? "#2563eb" : "#10b981")
      .attr("rx", 4);

    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x0))
      .style("font-size", "10px");
  }
}

/**
 * Event Listeners
 */
function setupListeners(input, display, callback) {
  input.addEventListener('input', (e) => {
    if (display.tagName === 'INPUT' && display.type === 'text') {
      display.value = Number(e.target.value).toLocaleString('en-IN');
    } else {
      display.value = e.target.value;
    }
    callback();
  });

  display.addEventListener('change', (e) => {
    let val;
    if (display.type === 'text') {
      val = parseCurrency(e.target.value);
    } else {
      val = Number(e.target.value);
    }
    
    if (isNaN(val)) val = Number(input.value);
    
    const min = Number(input.min);
    const max = Number(input.max);
    val = Math.max(min, Math.min(max, val));
    
    input.value = val;
    if (display.type === 'text') {
      display.value = val.toLocaleString('en-IN');
    } else {
      display.value = val;
    }
    callback();
  });
}

setupListeners(loanAmountInput, loanAmountDisplay, calculateAll);
setupListeners(tenureInput, tenureDisplay, calculateAll);
setupListeners(interestRateInput, interestRateDisplay, calculateAll);

setupListeners(loanAmountInput2, loanAmountDisplay2, calculateAll);
setupListeners(tenureInput2, tenureDisplay2, calculateAll);
setupListeners(interestRateInput2, interestRateDisplay2, calculateAll);

// Mode Toggles
singleModeBtn.addEventListener('click', () => {
  isCompareMode = false;
  singleModeBtn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
  singleModeBtn.classList.remove('text-slate-500');
  compareModeBtn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
  compareModeBtn.classList.add('text-slate-500');
  
  scenario2.classList.add('hidden');
  scenario1.classList.remove('lg:col-span-12');
  scenario1.classList.add('lg:col-span-7');
  results1.classList.remove('hidden');
  
  calculateAll();
});

compareModeBtn.addEventListener('click', () => {
  isCompareMode = true;
  compareModeBtn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
  compareModeBtn.classList.remove('text-slate-500');
  singleModeBtn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
  singleModeBtn.classList.add('text-slate-500');
  
  scenario2.classList.remove('hidden');
  scenario1.classList.remove('lg:col-span-7');
  scenario1.classList.add('lg:col-span-12');
  results1.classList.add('hidden'); // Hide single results in compare mode to focus on table
  
  calculateAll();
});

// Scroll to schedule
document.getElementById('viewScheduleBtn').addEventListener('click', () => {
  document.getElementById('scheduleSection').scrollIntoView({ behavior: 'smooth' });
});

// Export CSV
document.getElementById('downloadSchedule').addEventListener('click', () => {
  const rows = Array.from(scheduleBody.querySelectorAll('tr'));
  let csv = 'Month,Principal,Interest,Total,Balance\n';
  rows.forEach(row => {
    const cols = Array.from(row.querySelectorAll('td')).map(td => td.textContent.replace(/₹|,/g, ''));
    csv += cols.join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'amortization_schedule.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Initial calculation
window.addEventListener('resize', calculateAll);
calculateAll();
