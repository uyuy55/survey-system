// components/ResultsChart.js - 图表组件
import React from 'react';
import './ResultsChart.css';

const ResultsChart = ({ data, chartType = 'bar' }) => {
  const total = Object.values(data.options).reduce((sum, count) => sum + count, 0);
  
  // 准备饼图数据
  const pieData = Object.entries(data.options)
    .map(([option, count], index) => {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
      return {
        option,
        count,
        percentage,
        color: colors[index % colors.length]
      };
    })
    .filter(item => item.count > 0); // 过滤掉计数为0的选项

  // 渲染柱状图
  const renderBarChart = () => (
    <div className="chart-bars">
      {Object.entries(data.options).map(([option, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={option} className="chart-bar">
            <div className="bar-label">{option}</div>
            <div className="bar-container">
              <div 
                className="bar-fill"
                style={{ width: `${percentage}%` }}
                title={`${count}票 (${percentage.toFixed(1)}%)`}
              ></div>
            </div>
            <div className="bar-count">
              {count} ({percentage.toFixed(1)}%)
            </div>
          </div>
        );
      })}
    </div>
  );

  // 渲染饼图
  const renderPieChart = () => {
    // 如果没有数据，显示空状态
    if (pieData.length === 0) {
      return (
        <div className="pie-chart-container">
          <div className="pie-chart">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="#e2e8f0" />
              <circle cx="100" cy="100" r="60" fill="white" />
              <text x="100" y="100" textAnchor="middle" dy="0.3em" fill="#718096" fontSize="14">
                暂无数据
              </text>
            </svg>
          </div>
        </div>
      );
    }

    // 如果只有一个数据项，显示完整的圆
    if (pieData.length === 1) {
      return (
        <div className="pie-chart-container">
          <div className="pie-chart">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill={pieData[0].color} />
              <circle cx="100" cy="100" r="60" fill="white" />
              <text x="100" y="95" textAnchor="middle" fill="#2d3748" fontSize="12" fontWeight="bold">
                {pieData[0].percentage.toFixed(1)}%
              </text>
              <text x="100" y="110" textAnchor="middle" fill="#718096" fontSize="10">
                {pieData[0].count}票
              </text>
            </svg>
          </div>
          <div className="pie-legend">
            {pieData.map((item, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="legend-label">{item.option}</span>
                <span className="legend-count">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 多个数据项的饼图
    let currentAngle = 0;
    
    return (
      <div className="pie-chart-container">
        <div className="pie-chart">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {pieData.map((item, index) => {
              const angle = (item.percentage / 100) * 360;
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              // 计算弧线的起点和终点
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              
              const x1 = 100 + 80 * Math.cos(startAngle * Math.PI / 180);
              const y1 = 100 + 80 * Math.sin(startAngle * Math.PI / 180);
              
              const x2 = 100 + 80 * Math.cos(endAngle * Math.PI / 180);
              const y2 = 100 + 80 * Math.sin(endAngle * Math.PI / 180);
              
              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');
              
              const slice = (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color}
                  stroke="#fff"
                  strokeWidth="2"
                  className="pie-slice"
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                  }}
                >
                  <title>{item.option}: {item.count}票 ({item.percentage.toFixed(1)}%)</title>
                </path>
              );
              
              currentAngle += angle;
              return slice;
            })}
            <circle cx="100" cy="100" r="60" fill="white" />
            
            {/* 在饼图中心显示总票数 */}
            <text x="100" y="100" textAnchor="middle" dy="0.3em" fill="#2d3748" fontSize="14" fontWeight="bold">
              {total}
            </text>
          </svg>
        </div>
        
        <div className="pie-legend">
          {pieData.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="legend-label">{item.option}</span>
              <span className="legend-count">
                {item.count} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>统计图表</h4>
        <div className="chart-type-selector">
          <button className={chartType === 'bar' ? 'active' : ''}>
            柱状图
          </button>
          <button className={chartType === 'pie' ? 'active' : ''}>
            饼图
          </button>
        </div>
      </div>
      
      <div className="chart-content">
        {chartType === 'bar' && renderBarChart()}
        {chartType === 'pie' && renderPieChart()}
      </div>
      
      <div className="chart-summary">
        <p>总投票数: <strong>{total}</strong></p>
        <p>有效选项: <strong>{pieData.length}</strong></p>
      </div>
    </div>
  );
};

export default ResultsChart;