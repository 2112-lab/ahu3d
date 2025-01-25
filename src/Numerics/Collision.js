export default class Collision {
    computeIntersection(line1, line2) {
        // down part of intersection point formula
        let p1 = line1.start
        let p2 = line1.end
        let p3 = line2.start
        let p4 = line2.end
    
        var d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
        var d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
        var d = d1 - d2;
    
        if (d == 0) {
          return this.status = "zero_or_infinity";
        }
    
        // upper part of intersection point formula
        var u1 = p1.x * p2.y - p1.y * p2.x; // (x1 * y2 - y1 * x2)
        var u4 = p3.x * p4.y - p3.y * p4.x; // (x3 * y4 - y3 * x4)
    
        var u2x = p3.x - p4.x; // (x3 - x4)
        var u3x = p1.x - p2.x; // (x1 - x2)
        var u2y = p3.y - p4.y; // (y3 - y4)
        var u3y = p1.y - p2.y; // (y1 - y2)
    
        // intersection point formula
        var px = (u1 * u2x - u3x * u4) / d;
        var py = (u1 * u2y - u3y * u4) / d;
    
        var p = { x: px, y: py };
        this.xPoint.setXY(Number(Number(px).toFixed(2)), Number(Number(py).toFixed(2)))
    
        this.lines.push(line1)
        this.lines.push(line2)
    
        const isIntersection = this.checkLineIntersection(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
    
        if (!isIntersection) {
          return this.status = "no_intersection";
        }
    
        this.status = "computed";
    
        return p;
    }
    
    checkLineIntersection(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
        var denominator = (p4y - p3y) * (p2x - p1x) - (p4x - p3x) * (p2y - p1y);
        if (denominator == 0) {
            return false;
        }
    
        var ua = ((p4x - p3x) * (p1y - p3y) - (p4y - p3y) * (p1x - p3x)) / denominator;
        var ub = ((p2x - p1x) * (p1y - p3y) - (p2y - p1y) * (p1x - p3x)) / denominator;
    
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return true;
        }
        return false;
    }
}