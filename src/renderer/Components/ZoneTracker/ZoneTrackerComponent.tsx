import { useState } from 'react';
import { LayoutImagesComponent } from './LayoutImagesComponent';
import { ZoneNotesComponent } from './ZoneNotesComponent';

export function ZoneTrackerComponent(props: {
	zoneNotesActive: boolean;
	layoutImagesActive: boolean;
}) {
	//TODO I don't think I use this shared zone code anymore
	const [sharedZoneCode, setSharedZoneCode] = useState('');

	const conditionalRenderZoneNotes = () => {
		if (props.zoneNotesActive) {
			return (
				<ZoneNotesComponent
					sharedZoneCode={sharedZoneCode}
					setSharedZoneCode={setSharedZoneCode}
				/>
			);
		}
	};
	const conditionalRenderLayoutImages = () => {
		if (props.layoutImagesActive) {
			return <LayoutImagesComponent sharedZoneCode={sharedZoneCode} />;
		}
	};
	return (
		<div className="ZoneTrackerContainer">
			{conditionalRenderZoneNotes()}
			{conditionalRenderLayoutImages()}
		</div>
	);
}
