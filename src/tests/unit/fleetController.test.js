/**
 * Fleet controller unit tests.
 * Mocks Vehicle model — no live DB required.
 */
import { jest } from '@jest/globals';

//Mocks
const mockFind           = jest.fn();
const mockFindById       = jest.fn();
const mockFindByIdUpdate = jest.fn();
const mockFindByIdDelete = jest.fn();
const mockCreate         = jest.fn();

jest.unstable_mockModule('../../app/models/vehicle.js', () => ({
  default: {
    create:            mockCreate,
    find:              mockFind,
    findById:          mockFindById,
    findByIdAndUpdate: mockFindByIdUpdate,
    findByIdAndDelete: mockFindByIdDelete,
  },
}));

const { createVehicle, getVehicles, updateVehicle, deleteVehicle } =
  await import('../../app/controllers/fleetController.js');

//Helpers
const mockVehicle = (overrides = {}) => ({
  _id: 'vehicle-id-1',
  plateNumber: 'ABC-123',
  model: 'Toyota Coaster',
  capacity: 30,
  status: 'active',
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => { jest.clearAllMocks(); });

//createVehicle
describe('createVehicle', () => {
  it('creates a vehicle and responds 201', async () => {
    const vehicle = mockVehicle();
    mockCreate.mockResolvedValue(vehicle);

    const req = { body: vehicle };
    const res = mockRes();
    await createVehicle(req, res, mockNext);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ plateNumber: 'ABC-123' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(vehicle);
  });

  it('calls next(error) when Vehicle.create throws', async () => {
    const err = new Error('DB error');
    mockCreate.mockRejectedValue(err);

    await createVehicle({ body: mockVehicle() }, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

//getVehicles
describe('getVehicles', () => {
  it('returns a list of vehicles', async () => {
    const list = [mockVehicle(), mockVehicle({ _id: 'v2', plateNumber: 'XYZ-999' })];
    mockFind.mockResolvedValue(list);

    const res = mockRes();
    await getVehicles({ body: {} }, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(list);
    expect(res.json.mock.calls[0][0]).toHaveLength(2);
  });
});

//updateVehicle
describe('updateVehicle', () => {
  it('updates a vehicle and returns the new version', async () => {
    const updated = mockVehicle({ status: 'in_maintenance' });
    mockFindByIdUpdate.mockResolvedValue(updated);

    const req = { params: { id: 'vehicle-id-1' }, body: { status: 'in_maintenance' } };
    const res = mockRes();
    await updateVehicle(req, res, mockNext);

    expect(mockFindByIdUpdate).toHaveBeenCalledWith('vehicle-id-1', { status: 'in_maintenance' }, { new: true });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('responds 404 when vehicle is not found', async () => {
    mockFindByIdUpdate.mockResolvedValue(null);
    const req = { params: { id: 'bad-id' }, body: { status: 'retired' } };
    const res = mockRes();
    await updateVehicle(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Vehicle not found' });
  });
});

//deleteVehicle
describe('deleteVehicle', () => {
  it('deletes a vehicle and responds with a success message', async () => {
    mockFindByIdDelete.mockResolvedValue(mockVehicle());
    const req = { params: { id: 'vehicle-id-1' } };
    const res = mockRes();
    await deleteVehicle(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ message: 'Vehicle deleted successfully' });
  });

  it('responds 404 when vehicle is not found', async () => {
    mockFindByIdDelete.mockResolvedValue(null);
    const req = { params: { id: 'bad-id' } };
    const res = mockRes();
    await deleteVehicle(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Vehicle not found' });
  });
});