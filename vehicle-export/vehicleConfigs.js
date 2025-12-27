const vehicleConfigs = {
	defaults: {
		body: 'jeep_yj',
		lift: 8,
		color: '#c81414',
		roughness: 0,
		addons: {},
		lighting: {},
		wheel_offset: 0,
		rim: 'konig_countersteer',
		rim_color: 'gloss_black',
		rim_color_secondary: 'gloss_black',
		rim_diameter: 24,
		rim_width: 16,
		tire: 'bfg_km2',
		tire_diameter: 40,
		tire_muddiness: 0,
		spare: true,
	},
	vehicles: {
		jeep_yj: {
			name: 'Jeep Wrangler (YJ)',
			make: 'Jeep',
			model: 'assets/models/vehicles/jeep/yj/yj.glb',
			wheel_offset: 0.7,
			wheelbase: 2.372,
			driverPosition: [0.45, 1.65, -0.5],
			default_addons: {},
			addons: {},
			lighting: {
				lightbar: [
					{
						name: 'Roof Light Bar',
						width: 36,
						rows: 1,
						color: 'white',
						position: [0, 1.34, 0.1],
						rotation: [0, 0, 0],
						curvature: 99,
					},
					{
						name: 'Ditch Lights',
						width: 2,
						rows: 2,
						color: 'white',
						position: [0.75, 0.9, 0.3],
						rotation: [0, 0.45, 0],
						pair: true,
					},
				],
			},
		},
	},
	wheels: {
		rims: {
			konig_countersteer: {
				make: 'Konig',
				name: 'Konig Countersteer',
				model: 'assets/models/wheels/rims/konig_countersteer.glb',
				width: 0.5,
				od: 1,
			},
		},
		tires: {
			bfg_km2: {
				make: 'BFGoodrich',
				name: 'BFGoodrich KM2',
				model: 'assets/models/wheels/tires/bfg_km2.glb',
				width: 0.245,
				od: 0.837,
				id: 0.44,
			},
		},
	},
}

export default vehicleConfigs
