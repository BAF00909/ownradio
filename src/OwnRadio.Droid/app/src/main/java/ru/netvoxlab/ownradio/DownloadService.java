package ru.netvoxlab.ownradio;

import android.app.IntentService;
import android.content.Intent;

/**
 * An {@link IntentService} subclass for handling asynchronous task requests in
 * a service on a separate handler thread.
 * <p>
 * TODO: Customize class - update intent actions, extra parameters and static
 * helper methods.
 */
public class DownloadService extends IntentService {

	public DownloadService() {
		super("DownloadService");
	}

	@Override
	protected void onHandleIntent(Intent intent) {
		if (intent != null) {
			new TrackToCache(getApplicationContext()).SaveTrackToCache(intent.getStringExtra("DeviceID"), intent.getIntExtra("CountTracks", 3));
		}
	}
}
