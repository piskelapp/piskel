describe('Plane model test', function() {

  beforeEach(function() {});
  afterEach(function() {});

  it('has proper defaults', function() {
    var plane = new pskl.model.Plane('planeName');

    expect(plane.getOffset()).toBe(0);
    expect(plane.getLayers().length).toBe(0);
    expect(plane.getName()).toBe('planeName');
  });

  it('can set offset', function() {
    var plane = new pskl.model.Plane('planeName');

    plane.setOffset(0.5);
    expect(plane.getOffset()).toBe(0.5);
  });

  it('ignores bad offset', function() {
    var plane = new pskl.model.Plane('planeName');

    plane.setOffset(10);
    expect(plane.getOffset()).toBe(10);

    plane.setOffset('Yep I\'m an offset, let me in !');
    expect(plane.getOffset()).toBe(10);

    plane.setOffset(null);
    expect(plane.getOffset()).toBe(10);
  });
});
