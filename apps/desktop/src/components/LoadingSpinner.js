import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const LoadingSpinner = ({ size = 20, text, className = '', }) => {
    return (_jsxs("div", { className: `flex items-center gap-2 text-slate-400 ${className}`, children: [_jsxs("svg", { className: "animate-spin text-emerald-500", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", width: size, height: size, children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8H4z" })] }), text && _jsx("span", { className: "text-xs font-medium", children: text })] }));
};
//# sourceMappingURL=LoadingSpinner.js.map