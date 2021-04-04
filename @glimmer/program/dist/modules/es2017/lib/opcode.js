export class RuntimeOpImpl {
    constructor(heap) {
        this.heap = heap;
        this.offset = 0;
    }
    get size() {
        let rawType = this.heap.getbyaddr(this.offset);
        return ((rawType & 768 /* OPERAND_LEN_MASK */) >> 8 /* ARG_SHIFT */) + 1;
    }
    get isMachine() {
        let rawType = this.heap.getbyaddr(this.offset);
        return rawType & 1024 /* MACHINE_MASK */ ? 1 : 0;
    }
    get type() {
        return this.heap.getbyaddr(this.offset) & 255 /* TYPE_MASK */;
    }
    get op1() {
        return this.heap.getbyaddr(this.offset + 1);
    }
    get op2() {
        return this.heap.getbyaddr(this.offset + 2);
    }
    get op3() {
        return this.heap.getbyaddr(this.offset + 3);
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3Byb2dyYW0vbGliL29wY29kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiT0FFTSxNQUFPLGFBQVAsQ0FBb0I7QUFFeEIsZ0JBQXFCLElBQXJCLEVBQXFDO0FBQWhCLGFBQUEsSUFBQSxHQUFBLElBQUE7QUFEZCxhQUFBLE1BQUEsR0FBUyxDQUFUO0FBQ2tDO0FBRXpDLFFBQUksSUFBSixHQUFRO0FBQ04sWUFBSSxVQUFVLEtBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsS0FBSyxNQUF6QixDQUFkO0FBQ0EsZUFBTyxDQUFDLENBQUMsVUFBTyxHQUFSLENBQVEsc0JBQVIsS0FBdUMsQ0FBeEMsQ0FBd0MsZUFBeEMsSUFBb0UsQ0FBM0U7QUFDRDtBQUVELFFBQUksU0FBSixHQUFhO0FBQ1gsWUFBSSxVQUFVLEtBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsS0FBSyxNQUF6QixDQUFkO0FBQ0EsZUFBTyxVQUFPLElBQVAsQ0FBTyxrQkFBUCxHQUFvQyxDQUFwQyxHQUF3QyxDQUEvQztBQUNEO0FBRUQsUUFBSSxJQUFKLEdBQVE7QUFDTixlQUFPLEtBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsS0FBSyxNQUF6QixJQUFnQyxHQUF2QyxDQUF1QyxlQUF2QztBQUNEO0FBRUQsUUFBSSxHQUFKLEdBQU87QUFDTCxlQUFPLEtBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsS0FBSyxNQUFMLEdBQWMsQ0FBbEMsQ0FBUDtBQUNEO0FBRUQsUUFBSSxHQUFKLEdBQU87QUFDTCxlQUFPLEtBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsS0FBSyxNQUFMLEdBQWMsQ0FBbEMsQ0FBUDtBQUNEO0FBRUQsUUFBSSxHQUFKLEdBQU87QUFDTCxlQUFPLEtBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsS0FBSyxNQUFMLEdBQWMsQ0FBbEMsQ0FBUDtBQUNEO0FBNUJ1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9wY29kZVNpemUsIFJ1bnRpbWVPcCwgT3Bjb2RlSGVhcCB9IGZyb20gJ0BnbGltbWVyL2ludGVyZmFjZXMnO1xuXG5leHBvcnQgY2xhc3MgUnVudGltZU9wSW1wbCBpbXBsZW1lbnRzIFJ1bnRpbWVPcCB7XG4gIHB1YmxpYyBvZmZzZXQgPSAwO1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBoZWFwOiBPcGNvZGVIZWFwKSB7fVxuXG4gIGdldCBzaXplKCkge1xuICAgIGxldCByYXdUeXBlID0gdGhpcy5oZWFwLmdldGJ5YWRkcih0aGlzLm9mZnNldCk7XG4gICAgcmV0dXJuICgocmF3VHlwZSAmIE9wY29kZVNpemUuT1BFUkFORF9MRU5fTUFTSykgPj4gT3Bjb2RlU2l6ZS5BUkdfU0hJRlQpICsgMTtcbiAgfVxuXG4gIGdldCBpc01hY2hpbmUoKTogMCB8IDEge1xuICAgIGxldCByYXdUeXBlID0gdGhpcy5oZWFwLmdldGJ5YWRkcih0aGlzLm9mZnNldCk7XG4gICAgcmV0dXJuIHJhd1R5cGUgJiBPcGNvZGVTaXplLk1BQ0hJTkVfTUFTSyA/IDEgOiAwO1xuICB9XG5cbiAgZ2V0IHR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaGVhcC5nZXRieWFkZHIodGhpcy5vZmZzZXQpICYgT3Bjb2RlU2l6ZS5UWVBFX01BU0s7XG4gIH1cblxuICBnZXQgb3AxKCkge1xuICAgIHJldHVybiB0aGlzLmhlYXAuZ2V0YnlhZGRyKHRoaXMub2Zmc2V0ICsgMSk7XG4gIH1cblxuICBnZXQgb3AyKCkge1xuICAgIHJldHVybiB0aGlzLmhlYXAuZ2V0YnlhZGRyKHRoaXMub2Zmc2V0ICsgMik7XG4gIH1cblxuICBnZXQgb3AzKCkge1xuICAgIHJldHVybiB0aGlzLmhlYXAuZ2V0YnlhZGRyKHRoaXMub2Zmc2V0ICsgMyk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0=